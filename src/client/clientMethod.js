import bot from "../methods/connection";
import connection from "../db";
import moment from "moment-timezone";

class ClientMethod {
    //Фиксированное меню для пользователя
    async menuMainFixed(chatId, text){
        await bot.sendMessage(chatId, text, {
                reply_markup: {
                    keyboard: [
                        [
                            '📘 Бухгалтерия',
                            '⛲ Яндекс Заправки',
                            '⛲ Договоры',
                        ],
                        [
                            '⛲ Отдел сервиса',
                            '⛲ Отдел продаж',
                            '⛲ Car wash',
                        ],
                        [
                            '📱 Мобильное приложение',
                            '⛲ Маркетинг',
                            '✏ Служба поддержки',
                        ],
                        [
                            '📋 Посмотреть предыдущие запросы'
                        ]
                    ],
                    resize_keyboard: true
                }
            }
        )
    }

    //Поиск клиента по id
    async searchClient(clientId){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_CLIENT WHERE ID = $1';
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


    //Поиск клиента по tg_id
    async searchClientByTgId(chatId){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_CLIENT WHERE TG_CLIENT_ID = $1';
            await connection.query(sql, [chatId], async (err, result) => {
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

    //Поиск клиента по телефону
    async searchClientByPhone(phone){
        return new Promise( async (resolve) => {
            const sql = 'SELECT * FROM FRANCHISE_CLIENT WHERE PHONE = $1';
            await connection.query(sql, [phone], async (err, result) => {
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

    //Добавление tg_id клиенту
    async addTgItClient(chatId, phone){
        const sql = 'UPDATE FRANCHISE_CLIENT SET TG_CLIENT_ID = $1 WHERE PHONE = $2 ';
        await connection.query(sql, [chatId, phone], async (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    //Получение tg_id клиентов
    async getAllClient() {
        const sql = 'SELECT TG_CLIENT_ID FROM FRANCHISE_CLIENT WHERE TG_CLIENT_ID IS NOT NULL';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    const clientIds = result.rows.map(row => row.tg_client_id);
                    resolve(clientIds);
                }
            });
        });
    }

    //Получение tg_id клиентов франшизы
    async getAllClientFr(frId) {
        const sql = 'SELECT TG_CLIENT_ID FROM FRANCHISE_CLIENT WHERE TG_CLIENT_ID IS NOT NULL AND FRANCHISE_ID = $1';
        return new Promise(async (resolve, reject) => {
            await connection.query(sql, [frId], async (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    const clientIds = result.rows.map(row => row.tg_client_id);
                    resolve(clientIds);
                }
            });
        });
    }

    //Добавить клиента
    async addClient(phone, frId){
        const sql = 'INSERT INTO FRANCHISE_CLIENT (phone, franchise_id) VALUES ($1, $2)';
        await connection.query(sql, [phone, frId], async (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    //Добавление запроса
    async addReq(chatId, text, type, addDesc, tgMethod, reqMethod, adminMethod, clientMethod, frMethod, surveyStates, adminChat){
        const client = await this.searchClientByTgId(chatId);
        if (await reqMethod.searchActiveRequestOnTypeClient(client.id, type)){
            await tgMethod.sendMessageWithRetry(chatId, `У вас уже есть активный запрос по данной теме. Дополнительную информацию по нему можно оставить в качестве комментария.`);
            surveyStates.delete(chatId);
        } else {
            await tgMethod.sendMessageWithRetry(chatId, text);
            let description = addDesc;
            const addDescription = async (msg) =>{
                if (msg.chat.id === chatId) {

                    if (msg.photo && msg.photo.length > 0) {
                        if (msg.caption !== undefined) {
                            description = description + msg.caption;
                        } else {
                            description = description + 'Добавлено только фото.';
                        }
                    } else if (msg.document) {
                        if (msg.caption !== undefined) {
                            description = description + msg.caption;
                        } else {
                            description = description + 'Добавлен только документ.';
                        }
                    } else if (msg.video) {
                        if (msg.caption !== undefined) {
                            description = description + msg.caption;
                        } else {
                            description = description + 'Добавлено только видео.';
                        }
                    } else if (msg.video_note) {
                        description = description + 'Добавлено только видеосообщение.';
                    } else if (msg.voice) {
                        description = description + 'Добавлено только голосовое сообщение.';
                    } else {
                        description = description + msg.text;
                    }

                    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    const currentHour = moment().tz('Europe/Moscow').hours();

                    const oldReqCom = await reqMethod.searchComMod(client.id);
                    if (oldReqCom) {
                        await reqMethod.changeComMod(oldReqCom.id, 0);
                    }
                    const request = await reqMethod.addRequest(client.id, currentDate, type, description, 1, 1);

                    if (msg.photo && msg.photo.length > 0) {
                        await reqMethod.addMedia(request.id, 'request', msg.photo[msg.photo.length - 1].file_id, 'photo');
                    } else if (msg.document) {
                        await reqMethod.addMedia(request.id, 'request', msg.document.file_id, 'doc');
                    } else if (msg.video) {
                        await reqMethod.addMedia(request.id, 'request', msg.video.file_id, 'video');
                    } else if (msg.video_note) {
                        await reqMethod.addMedia(request.id, 'request', msg.video_note.file_id, 'videoNote');
                    } else if (msg.voice) {
                        await reqMethod.addMedia(request.id, 'request', msg.voice.file_id, 'voice');
                    }

                    if (currentHour >= 8 && currentHour < 17) {
                        await tgMethod.sendMessageWithRetry(chatId, `Ваш запрос создан и направлен администратору.\nНомер обращения: ${request.id}, ожидайте!\nМы ответим вам в ближайшее время☺`);
                    } else {
                        await tgMethod.sendMessageWithRetry(chatId, `Спасибо за вашу заявку!\nВ данный момент рабочий день администраторов закончен, они обязательно ответят вам завтра⭐\nНомер обращения: ${request.id}, ожидайте☺`);
                    }
                    await tgMethod.sendMessageWithRetry(chatId, `Теперь вы находитесь в ожидании ответа по вашему запросу. Все, что напишете сейчас, будет автоматически направлено адмнистратору в качестве дополнительного комментария!\n Для общения по другому запросу переключитесь в меню всех обращений📩`);

                    bot.removeListener('message', addDescription);
                    surveyStates.delete(chatId);
                    await adminMethod.showAdminRequest(adminChat, client.id, request.id, currentDate, type, description, 1, tgMethod, clientMethod, frMethod, reqMethod);
                } else {
                    console.log("Ожидание нужного пользователя для ввода описания.");
                }
            }
            bot.on('message', addDescription);
        }
    }

    //Отображение запроса для клиента
    async showClientRequest(chatId, requestId, date, type, description, isActive, comMod, tgMethod, reqMethod){
        let status = "Закрыто";
        if (isActive === 1){
            status = "Активно";
        }
        const formattedDate = await tgMethod.formatDate(date);
        const messageText = `<b>Номер запроса:</b> ${requestId}\n<b>Дата создания: </b>${formattedDate}\n<b>Статус: </b>${status}\n<b>Тип: </b>${type}\n<b>Описание: </b>${description}\n`;

        await tgMethod.sendMessageWithRetry(chatId, messageText);
        const media = await reqMethod.searchMedia(requestId, "request");
        if (media){
            await reqMethod.sendMedia(chatId, media.url, media.filling);
        }
        if (isActive === 0 || comMod === 1 || type === 'Бухгалтерия' || type === 'Маркетинг' || type === 'Отдел продаж' || type ==='Car wash. Инструкции'
            || type ==='Car wash. Обучение' || type === 'Яндекс Заправки. Отчет комитенту' || type === 'Яндекс Заправки. УПД') {
            await bot.sendMessage(chatId,
                `Выберите свои действия:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '🗒Посмотреть историю комментариев', callback_data: `historyComment:${requestId}`}],
                            [{text: '🗃Посмотреть другие запросы', callback_data: 'requestHistory'},]
                        ]
                    }
                })
        } else {
            await bot.sendMessage(chatId,
                `Выберите свои действия:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '🗒Посмотреть историю комментариев', callback_data: `historyComment:${requestId}`}],
                            [{text: '📝Перейти в режим общения', callback_data: `communicationMode:${requestId}`}],
                            [{text: '🗃Посмотреть другие запросы', callback_data: 'requestHistory'},]
                        ]
                    }
                })
        }
    }

    //Вывод всех запросов клиента
    async viewRequestHistory(chatId, requestMethod, tgMethod){
        const client = await this.searchClientByTgId(chatId);
        const requests = await requestMethod.searchRequestClient(client.id);
        if (requests.length > 0){
            const ids = requests.map(request => request.id).join(', ');
            await tgMethod.sendMessageWithRetry(chatId, `<i>Номера данных запросов: ${ids}</i>`);
            await tgMethod.sendMessageWithRetry(chatId, `<i>Для просмотра информации выберете номер запроса:</i>`);
            const protectionReqHist = async (msg) => {
                if (msg.chat.id === chatId) {
                    const request = await requestMethod.searchRequest(msg.text);
                    if (request) {
                        bot.removeListener('text', protectionReqHist);
                        await this.showClientRequest(chatId, request.id, request.date, request.type, request.description, request.is_active, request.communication_mode, tgMethod, requestMethod);
                    } else {
                        await tgMethod.sendMessageWithRetry(chatId, `<i>Запроса с таким id нету.</i>`);
                    }
                } else {
                    console.log("Ожидание нужного пользователя для просмотра истории.")
                }
            }
            bot.on('text', protectionReqHist);
        } else {
            await tgMethod.sendMessageWithRetry(chatId, '<i>Вы еще не делали запросов.</i>')
        }
    }

    //Регистрация в системе
    async registration(chatId, tgMethod, frMethod, processReq){
        await tgMethod.sendMessageWithRetry(chatId, "Клиент не обнаружен. Нужно ввести телефон. (без + и начиная с 7)");
        const phoneReg = async (msg) =>{
            if (msg.chat.id === chatId) {
                const phone = msg.text;
                if (phone[0] !== "7" || phone.length !== 11){
                    await tgMethod.sendMessageWithRetry(chatId, "Неверный формат");
                } else {
                    const client = await this.searchClientByPhone(phone);
                    if (client){
                        await this.menuMainFixed(msg.chat.id, 'Клиентский чат. Меню закрепелено');
                        await this.addTgItClient(chatId, phone);
                    } else {
                        await tgMethod.sendMessageWithRetry(chatId, "Франшиза найдена не найдена. Свяжитесь с офисом для добавления ваших контактов.");
                    }
                    processReq.delete(chatId);
                    bot.removeListener('text', phoneReg);
                }
            } else {
                console.log("Ожидание нужного пользователя для ввода телефона.");
            }
        }
        bot.on('text', phoneReg);
    }

    //Переход к режиму общения
    async onCommunicationMode(chatId, requestId, reqMethod, tgMethod) {
        const client = await this.searchClientByTgId(chatId);
        const oldReqCom = await reqMethod.searchComMod(client.id);
        if (oldReqCom) {
            await reqMethod.changeComMod(oldReqCom.id, 0);
        }
        await reqMethod.changeComMod(requestId, 1);
        await tgMethod.sendMessageWithRetry(chatId, `<i>Теперь вы находитесь в режиме общения для запроса ${requestId}.</i>`)
    }
    //Меню Бухгалтерия Ориг
    async accounting(chatId){
        await bot.sendMessage(chatId,
            `Вы хотите получить оригиналы документов в распечатанном виде?`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Да', callback_data: `accounting:1`}
                        ],
                        [
                            {text: 'Нет', callback_data: `accounting:0`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню Бухгалтерия выбор документа
    async accountingDoc(chatId, orig){
        await bot.sendMessage(chatId,
            `Выберите документ:`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Счета', callback_data: `accountingDoc:1:${orig}`}
                        ],
                        [
                            {text: 'Активы', callback_data: `accountingDoc:2:${orig}`}
                        ],
                        [
                            {text: 'Отчет комитенту', callback_data: `accountingDoc:3:${orig}`}
                        ],
                        [
                            {text: 'УПД', callback_data: `accountingDoc:4:${orig}`}
                        ],
                        [
                            {text: 'Акты сверки', callback_data: `accountingDoc:5:${orig}`}
                        ],
                        [
                            {text: 'Яндекс Заправки', callback_data: `accountingDoc:6:${orig}`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню маркетинга
    async marketing(chatId){
        await bot.sendMessage(chatId,
            `Вы хотите получить информацию об актуальных акциях, скидках сети МОЙ-КА!DS?`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Да', callback_data: `marketingYes`}
                        ],
                        [
                            {text: 'Нет', callback_data: `marketingNo`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню мобильного
    async phoneMenu(chatId){
        await bot.sendMessage(chatId,
            `Что Вас интересует?`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Задать вопрос', callback_data: `mobReq`}
                        ],
                        [
                            {text: 'Жалоба клиента', callback_data: `claimClient`}
                        ],
                        [
                            {text: 'Хочу подключить мобильное приложение!', callback_data: `plug`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню мобильного подключения
    async plugMenu(chatId){
        await bot.sendMessage(chatId,
            `Что Вас интересует?`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Презентация приложения', callback_data: `pres`}
                        ],
                        [
                            {text: 'Договор ', callback_data: `doc`},
                        ]
                    ]
                }
            }
        )
    }

    //Меню мобильного
    async cwMenu(chatId){
        await bot.sendMessage(chatId,
            `Что Вас интересует?`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Задать вопрос', callback_data: `cwReq`}
                        ],
                        [
                            {text: 'Инструкции', callback_data: `manual`}
                        ],
                        [
                            {text: 'Запись на обучение', callback_data: `registrationForTraining`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню отдела продаж
    async sdMenu(chatId){
        await bot.sendMessage(chatId,
            `Что Вы хотите приобрести?`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Автохимия', callback_data: `sdAutochemistry`}
                        ],
                        [
                            {text: 'Оборудование', callback_data: `sdEquipment`}
                        ],
                        [
                            {text: 'Другое', callback_data: `sdOther`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню Договора
    async contractMenu(chatId){
        await bot.sendMessage(chatId,
            `Выберите пункт, по которому нужна консультация:`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Договор коммерческой концессии', callback_data: `contract:1`}
                        ],
                        [
                            {text: 'Агентский договор', callback_data: `contract:2`}
                        ],
                        [
                            {text: 'Договор на ПО/ПЛ', callback_data: `contract:3`}
                        ],
                        [
                            {text: 'Договор на Мобильное приложение', callback_data: `contract:4`}
                        ]
                    ]
                }
            }
        )
    }

    //Меню Яндекс заправок
    async yaMenu(chatId){
        await bot.sendMessage(chatId,
            `Выберите пункт, по которому нужна консультация:`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Договор', callback_data: `yaReq:1`}
                        ],
                        [
                            {text: 'Отчет комитенту', callback_data: `yaShort:1`}
                        ],
                        [
                            {text: 'УПД', callback_data: `yaShort:2`}
                        ],
                        [
                            {text: 'Проблемы с приложением', callback_data: `yaReq:2`}
                        ],
                        [
                            {text: 'Хочу подключиться!', callback_data: `yaReq:3`}
                        ]
                    ]
                }
            }
        )
    }

    //Маркетинг при выборе Да
    async marketingYes(chatId, type, tgMethod, reqMethod, adminMethod, clientMethod, frMethod, adminChat){
        const client = await this.searchClientByTgId(chatId);

        const description = "Актуальные акции и скидки  МОЙ-КА!DS.";

        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const currentHour = moment().tz('Europe/Moscow').hours();
        const request = await reqMethod.addRequest(client.id, currentDate, type, description, 1, 0);

        if (currentHour >= 8 && currentHour < 17) {
            await tgMethod.sendMessageWithRetry(chatId, `Ваш запрос создан и направлен админестратору, ожидайте!\nМы ответим вам в ближайшее время☺`);
        } else {
            await tgMethod.sendMessageWithRetry(chatId, `Спасибо за вашу заявку!\nВ данный момент рабочий день админестраторов закончен, они обязательно ответят вам завтра, ожидайте☺`);
        }

                await adminMethod.showAdminRequest(adminChat, client.id, request.id, currentDate, type, description, 1, tgMethod, clientMethod, frMethod, reqMethod);
    }

    //Маркетинг при выборе Нет
    async shortRequest(chatId, type, text, addDesc, tgMethod, reqMethod, adminMethod, clientMethod, frMethod, surveyStates, adminChat){
        const client = await this.searchClientByTgId(chatId);
        await tgMethod.sendMessageWithRetry(chatId, text);
        const addDescriptionMarc = async (msg) =>{
            if (msg.chat.id === chatId) {
                const description = addDesc + msg.text;

                const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const currentHour = moment().tz('Europe/Moscow').hours();
                const request = await reqMethod.addRequest(client.id, currentDate, type, description, 1, 0);


                if (currentHour >= 8 && currentHour < 17) {
                    await tgMethod.sendMessageWithRetry(chatId, `Ваш запрос создан и направлен администратору, ожидайте!\nМы ответим вам в ближайшее время☺`);
                } else {
                    await tgMethod.sendMessageWithRetry(chatId, `Спасибо за вашу заявку!\nВ данный момент рабочий день администраторов закончен, они обязательно ответят вам завтра, ожидайте☺`);
                }

                bot.removeListener('message', addDescriptionMarc);
                surveyStates.delete(chatId);
                await adminMethod.showAdminRequest(adminChat, client.id, request.id, currentDate, type, description, 1, tgMethod, clientMethod, frMethod, reqMethod);
            } else {
                console.log("Ожидание нужного пользователя для ввода описания.");
            }
        }
        bot.on('message', addDescriptionMarc);
    }
}
export default ClientMethod;