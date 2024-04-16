import bot from "../methods/connection";
import connection from "../db";
import moment from "moment-timezone";

class RequestMethod {

    //Добавление запроса
    async addRequest(clientId, date, type, description, status, comMod) {
        const sql = 'INSERT INTO FRANCHISE_REQUEST (client_id, date, type, description, is_active, communication_mode) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        const values = [
            clientId,
            date,
            type,
            description,
            status,
            comMod
        ];
        return new Promise( async (resolve) => {
            await connection.query(sql, values, async (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    resolve(result.rows[0]);
                }
            });
        });
    }

    //Поиск запроса
    async searchRequest(requestId){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE ID = $1';
            await connection.query(sql, [requestId], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Поиск всех запросов для определенного клиента
    async searchRequestClient(clientId){
        const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE CLIENT_ID = $1 ORDER BY ID';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, [clientId], async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    }
    //Поиск активного запроса для определенного клиента
    async searchActiveRequestClient(clientId){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE CLIENT_ID = $1 AND IS_ACTIVE = 1';
            await connection.query(sql, [clientId], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Поиск активного запроса для определенного клиента
    async searchActiveRequestOnTypeClient(clientId, type){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE CLIENT_ID = $1 AND IS_ACTIVE = 1 AND TYPE = $2';
            await connection.query(sql, [clientId, type], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Поиск всех активных запросов
    async searchActiveRequest(){
        const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE IS_ACTIVE = 1 ORDER BY ID';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    }

    //Поиск всех закрытых запросов
    async searchCloseRequest(){
        const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE IS_ACTIVE = 0 ORDER BY ID';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    }

    //Поиск всех активных запросов по типу
    async searchActiveOnTypeRequest(type){
        const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE TYPE LIKE $1 || \'%\' AND IS_ACTIVE = 1 ORDER BY ID';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, [type], async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    }

    //Добавление коментария в БД
    async addComment(requestId, sender, date, text){
        const sql = 'INSERT INTO FRANCHISE_MESSAGE(REQUEST_ID, SENDER, DATE, TEXT) VALUES($1, $2, $3, $4) RETURNING id';
        return new Promise( async (resolve) => {
            await connection.query(sql, [requestId, sender, date, text], async (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    resolve(result.rows[0]);
                }
            });
        });
    }

    //Дополнение к комментарию на стороне отвечающего
    async sendCommentAnswer(chatId, requestId, commentId, text, tgMethod, sender){
        await tgMethod.sendMessageWithRetry(chatId, `<b>${sender} добавил комментарий к запросу ${requestId}:</b>\n <i>${text}</i>`);
        const media = await this.searchMedia(commentId, "comment");
        if (media) {
            await this.sendMedia(chatId, media.url, media.filling);
        }
        if(sender === 'Клиент') {
            await bot.sendMessage(chatId,
                `Нажмите, чтобы отправить ответ:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: 'Ответить', callback_data: `addComment:${requestId}`}
                            ]
                        ]
                    }
                }
            )
        }
    }

    //Отправка комментария
    async sendComment(request, msg, sender, addressee, tgMethod){
        let textMsg = msg.text;
        if (msg.photo && msg.photo.length > 0) {
            if (msg.caption !== undefined) {
                textMsg = msg.caption;
            } else {
                textMsg = 'Добавлено только фото.';
            }
        } else if (msg.document) {
            if (msg.caption !== undefined) {
                textMsg = msg.caption;
            } else {
                textMsg = 'Добавлен только документ.';
            }
        } else if (msg.video) {
            if (msg.caption !== undefined) {
                textMsg = msg.caption;
            } else {
                textMsg = 'Добавлено только видео.';
            }
        } else if (msg.video_note) {
            textMsg = 'Добавлено только видеосообщение.';
        } else if (msg.voice) {
            textMsg = 'Добавлено только голосовое сообщение.';
        }
        const currentDateTime = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
        const comment = await this.addComment(request.id, sender, currentDateTime, textMsg);

        if (msg.photo && msg.photo.length > 0) {
            await this.addMedia(comment.id, 'comment', msg.photo[msg.photo.length - 1].file_id, 'photo');
        } else if (msg.document) {
            await this.addMedia(comment.id, 'comment', msg.document.file_id, 'doc');
        } else if (msg.video) {
            await this.addMedia(comment.id, 'comment', msg.video.file_id, 'video');
        } else if (msg.video_note) {
            await this.addMedia(comment.id, 'comment', msg.video_note.file_id, 'videoNote');
        } else if (msg.voice) {
            await this.addMedia(comment.id, 'comment', msg.voice.file_id, 'voice');
        }
        await this.sendCommentAnswer(addressee, request.id, comment.id, textMsg, tgMethod, sender)
    }

    //История комментариев по запросу
    async historyComment(requestId){
        const sql = 'SELECT * FROM FRANCHISE_MESSAGE WHERE REQUEST_ID = $1 ORDER BY DATE';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, [requestId], async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    }

    //Отображение истории комментариев
    async viewHistoryComment(chatId, requestId, tgMethod){
        const comments = await this.historyComment(requestId);
        if (comments.length > 0) {
            let delayMs = 1500;
            for (const [index, item] of comments.entries()) {
                await tgMethod.delay(delayMs*index);
                try {
                    const messageText = `<b>${item.date.toLocaleString()}\n ${item.sender}:</b> \n <i>${item.text}</i>`;
                    await tgMethod.sendMessageWithRetry(chatId, messageText);
                    const media = await this.searchMedia(item.id, "comment");
                    if (media) {
                        await this.sendMedia(chatId, media.url, media.filling);
                    }
                } catch (error) {
                    if (error.response && error.response.status === 429 && error.response.status === 428) {
                        delayMs += 1000; // Увеличиваем задержку на 1 секунду при получении ошибки 429
                    }
                }
            }
            await tgMethod.sendMessageWithRetry(chatId, `<i>Конец истории комментариев.</i>`);
        } else {
            await tgMethod.sendMessageWithRetry(chatId, `<i>Комментариев по запросу ${requestId} нету.</i>`);
        }
    }

    //Добавление медиа в БД
    async addMedia(ownerId, type, url, filling){
        const sql = 'INSERT INTO FRANCHISE_MEDIA(owner_id, type, url, filling) VALUES($1, $2, $3, $4)';
        await connection.query(sql, [ownerId, type, url, filling], async (err) => {
            if (err) console.log(err);
        });
    }

    //Поиск медиа
    async searchMedia(ownerId, type){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_MEDIA WHERE owner_id = $1 AND type = $2';
            await connection.query(sql, [ownerId, type], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Отправка медиа
    async sendMedia(chatId, url, filling) {
        if(filling === 'photo') {
            await bot.sendPhoto(chatId, url, {caption: "Приложенное фото."});
            await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка в миллисекундах
        } else if(filling === 'doc') {
            await bot.sendDocument(chatId, url, {caption: "Приложенный документ."});
            await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка в миллисекундах
        } else if(filling === 'video') {
            await bot.sendVideo(chatId, url, {caption: "Приложенное видео."});
            await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка в миллисекундах
        } else if(filling === 'videoNote') {
            await bot.sendVideo(chatId, url, {caption: "Приложенное видеосообщение."});
            await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка в миллисекундах
        } else if(filling === 'voice') {
            await bot.sendVoice(chatId, url, {caption: "Приложенное голосовое сообщение."});
            await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка в миллисекундах
        }
    }

    //Поиск обращения с активным режимом общения
    async searchComMod(clientId){
        const sql = 'SELECT * FROM FRANCHISE_REQUEST WHERE COMMUNICATION_MODE = 1 AND CLIENT_ID = $1';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, [clientId], async (err, result) => {
                if (err) {
                    console.log(err);
                }else {
                    if (result.rows) {
                        resolve(result.rows[0]);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    //Изменить режим общения
    async changeComMod(requestId, mod){
        const sql = 'UPDATE FRANCHISE_REQUEST SET COMMUNICATION_MODE = $1 WHERE ID = $2 ';
        await connection.query(sql, [mod, requestId], async (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    //Закрыть запрос
    async closeRequest(requestId){
        const sql = 'UPDATE FRANCHISE_REQUEST SET IS_ACTIVE = 0 WHERE ID = $1 ';
        await connection.query(sql, [requestId], async (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}
export default RequestMethod;