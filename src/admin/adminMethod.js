import bot from "../methods/connection";

class AdminMethod {
    //Фиксированное меню для админа
    async menuAdminMainFixed(chatId, text){
        await bot.sendMessage(chatId,
            `${text} К клавиатуре прикреплено меню для выбора действий.`, {
                reply_markup: {
                    keyboard: [
                        [
                            'Бухгалтерия',
                            'ЯЗ',
                            'Договоры'
                        ],
                        [
                            'Отдел сервиса',
                            'Отдел продаж',
                            'CW'
                        ],
                        [
                            'МП',
                            'Маркетинг',
                            'Служба поддержки'
                        ],
                        [
                            'Отзывы',
                            'Удалить отзыв',
                        ],
                        [
                            'Активные запросы',
                            'Завершенные запросы',
                        ],
                        [
                            'Добавить клиента',
                            'Добавить франшизу',
                        ],
                        [
                            'Сделать рассылку'
                        ]
                    ],
                    resize_keyboard: true
                }
            }
        )
    }

    //Добавить название франшизы
    async addFrName(chatId, tgMethod, frMethod){
        await tgMethod.sendMessageWithRetry(chatId, "Введите название франшизы");
        const addName = async (msg) =>{
            if (msg.chat.id === chatId) {
                const name = msg.text;
                if (await frMethod.searchFrOnName(name)){
                    bot.removeListener('text', addName);
                    await tgMethod.sendMessageWithRetry(chatId, "Франшиза с таким названием уже существует");
                } else {
                    bot.removeListener('text', addName);
                    await this.addFr(chatId, name, tgMethod, frMethod);
                }
            } else {
                console.log("Ожидание нужного пользователя для ввода названия.");
            }
        }
        bot.on('text', addName);
    }

    //Добавить франшизу
    async addFr(chatId, name, tgMethod, frMethod){
        await tgMethod.sendMessageWithRetry(chatId, "Введите город франшизы");
        const addCity = async (msg) =>{
            if (msg.chat.id === chatId) {
                const city = msg.text;
                await frMethod.addFranchise(name, city);
                await tgMethod.sendMessageWithRetry(chatId, "Франшиза создана.");
                bot.removeListener('text', addCity);
            } else {
                console.log("Ожидание нужного пользователя для ввода города.");
            }
        }
        bot.on('text', addCity);
    }

    //Добавить телефон клиента
    async addClientPhone(chatId, tgMethod, clientMethod, frMethod){
        await tgMethod.sendMessageWithRetry(chatId, "Введите телефон клиента. (без + и начиная с 7)");
        const addPhone = async (msg) =>{
            if (msg.chat.id === chatId) {
                const phone = msg.text;
                if (phone[0] !== "7" || phone.length !== 11){
                    bot.removeListener('text', addPhone);
                    await tgMethod.sendMessageWithRetry(chatId, "Неверный формат");
                } else {
                    if (await clientMethod.searchClientByPhone(phone)){
                        bot.removeListener('text', addPhone);
                        await tgMethod.sendMessageWithRetry(chatId, "Клиент с таким телефоном уже существует");
                    } else {
                        bot.removeListener('text', addPhone);
                        await this.addCl(chatId, phone, tgMethod, clientMethod, frMethod);
                    }
                }
            } else {
                console.log("Ожидание нужного пользователя для ввода телефона.");
            }
        }
        bot.on('text', addPhone);
    }

    //Добавить клиента
    async addCl(chatId, phone, tgMethod, clientMethod, frMethod){
        await tgMethod.sendMessageWithRetry(chatId, "Введите название франшизы");
        const addFrId = async (msg) =>{
            if (msg.chat.id === chatId) {
                const name = msg.text;
                const fr = await frMethod.searchFrOnName(name);
                if (fr){
                    await clientMethod.addClient(phone, fr.id);
                    await tgMethod.sendMessageWithRetry(chatId, "Клиент добавлен.");
                } else {
                    await tgMethod.sendMessageWithRetry(chatId, "Франшиза не найдена.");
                }
                bot.removeListener('text', addFrId);
            } else {
                console.log("Ожидание нужного пользователя для названия франшизы.");
            }
        }
        bot.on('text', addFrId);
    }

    //Отображение запроса для админа
    async showAdminRequest(chatId, clientId, requestId, date, type, description, isActive, tgMethod, clientMethod, frMethod, reqMethod){
        let status = "Закрыто";
        if (isActive === 1){
            status = "Активно";
        }
        const client = await clientMethod.searchClient(clientId);
        const fr = await frMethod.searchFrOnId(client.franchise_id);
        const formattedDate = await tgMethod.formatDate(date);
        const messageText = `<b>Номер запроса:</b> ${requestId}\n<b>Дата создания: </b>${formattedDate}\n<b>Статус: </b>${status}\n<b>Франшиза: </b>${fr.name}\n<b>Телефон: </b>${client.phone}\n<b>Тип запроса: </b>${type}\n<b>Описание: </b>${description}\n`;

        await tgMethod.sendMessageWithRetry(chatId, messageText);
        const media = await reqMethod.searchMedia(requestId, "request");
        if (media){
            await reqMethod.sendMedia(chatId, media.url, media.filling);
        }
        await this.menuAdminRequest(chatId, requestId, status, type);
    }

    //Вывод всех запросов для админа с учетом статуса обращения
    async adminRequest(chatId, checkStatus, type, tgMethod, requestMethod){
        let requests;
        if (checkStatus === 0){
            requests = await requestMethod.searchCloseRequest();

        } else if (type !== ''){
            requests = await requestMethod.searchActiveOnTypeRequest(type);

        } else {
            requests = await requestMethod.searchActiveRequest();

        }
        if (requests.length > 0){
            const ids = requests.map(request => request.id).join(', ');
            await tgMethod.sendMessageWithRetry(chatId, `<i>Номера данных запросов: ${ids}</i>`);
        } else {
            await tgMethod.sendMessageWithRetry(chatId, '<i>Таких запросов нет.</i>')
        }
    }

    //Отправка комменатрия админом
    async sendCommentAdmin(requestId, chatId, chSendComment, clientMethod, requestMethod, tgMethod){
        const request = await requestMethod.searchRequest(requestId);
        const client = await clientMethod.searchClient(request.client_id);
        await tgMethod.sendMessageWithRetry(chatId, "Напишите комментарий:");
        const addCom = async (msg) =>{
            if (msg.chat.id === chatId) {
                await requestMethod.sendComment(request, msg, "Администратор", client.tg_client_id, chSendComment, tgMethod);
                bot.removeListener('message', addCom);
                await tgMethod.sendMessageWithRetry(chatId, "Комментарий добавлен!");
            } else {
                console.log("Ожидание нужного пользователя для комментария.");
            }
        }
        bot.on('message', addCom);
    }

    //Отправка ответа по маркетингу
    async sendCommentAdminShort(requestId, chatId, clientMethod, requestMethod, tgMethod){
        const request = await requestMethod.searchRequest(requestId);
        const client = await clientMethod.searchClient(request.client_id);
        await tgMethod.sendMessageWithRetry(chatId, "Добавьте ответ:");
        const addOth = async (msg) =>{
            if (msg.chat.id === chatId) {
                await requestMethod.sendComment(request, msg, "Администратор", client.tg_client_id, 0, tgMethod);
                bot.removeListener('message', addOth);
                await tgMethod.sendMessageWithRetry(chatId, "Ответ добавлен!");
                await requestMethod.closeRequest(requestId);
            } else {
                console.log("Ожидание нужного пользователя для ответа.");
            }
        }
        bot.on('message', addOth);
    }

    //Выпадающее меню к обращению для администратора
    async menuAdminRequest(chatId, requestId, status, type){
        if(status === 'Закрыто'){
            await bot.sendMessage(chatId,
                `Выберите действие для запроса ${requestId}:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: 'Посмотреть все комментарии', callback_data: `historyComment:${requestId}`}
                            ]
                        ]
                    }
                }
            )
        }/* else if(type === 'Бухгалтерия' || type === 'Маркетинг' || type === 'Отдел продаж' || type ==='Car wash. Инструкции'
            || type ==='Car wash. Обучение' || type === 'Яндекс Заправки. Отчет комитенту' || type === 'Яндекс Заправки. УПД'){
            await bot.sendMessage(chatId,
                `Выберите действие для запроса ${requestId}:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {text: 'Ответить', callback_data: `sendShortComment:${requestId}`}
                            ]
                        ]
                    }
                }
            )
        }*/ else if(type === 'Отзывы'){
            await bot.sendMessage(chatId,
                `Запрос ${requestId}:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: 'Загрузить отзыв', callback_data: `sendComment:${requestId}`}],
                            [{text: 'Посмотреть все комментарии', callback_data: `historyComment:${requestId}`}],
                            [{text: 'Закрыть запрос', callback_data: `closeAdminStatus:${requestId}`}]
                        ]
                    }
                }
            )
        } else {
            await bot.sendMessage(chatId,
                `Запрос ${requestId}:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{text: 'Ответить', callback_data: `addComment:${requestId}`}],
                            [{text: 'Посмотреть все комментарии', callback_data: `historyComment:${requestId}`}],
                            [{text: 'Закрыть запрос', callback_data: `closeAdminStatus:${requestId}`}]
                        ]
                    }
                }
            )
        }
    }

    //Вывод запроса по id
    async searchRequestById(chatId, requestId, tgMethod, clientMethod, frMethod, requestMethod) {
        const request = await requestMethod.searchRequest(requestId);
        await this.showAdminRequest(chatId, request.client_id, requestId, request.date, request.type, request.description, request.is_active, tgMethod, clientMethod, frMethod, requestMethod);
    }

    //Закрытие запроса
    async closeReq(requestId, chatId, tgMethod, clientMethod, requestMethod){
        await requestMethod.closeRequest(requestId);
        await requestMethod.changeComMod(requestId, 0);
        await tgMethod.sendMessageWithRetry(chatId, "Запрос закрыт.");
        const request = await requestMethod.searchRequest(requestId);
        const client = await clientMethod.searchClient(request.client_id);
        await tgMethod.sendMessageWithRetry(client.tg_client_id, `<i>Запрос ${requestId} закрыт.</i>`);
    }

    //Рассылка
    async makeNewsletter(chatId, clients, clientMethod, tgMethod){
        if(clients.length > 0){
            await tgMethod.sendMessageWithRetry(chatId, `<i>Напишите текст и вставьте фото для создания рассылки:</i>`);
            const protectionNews = async (msg) => {
                if (msg.chat.id === chatId) {
                    if (msg.photo && msg.photo.length > 0) {
                        if (msg.caption !== undefined){
                            for (const [, item] of clients.entries()) {
                                await bot.sendPhoto(item, msg.photo[msg.photo.length-1].file_id, { caption: msg.caption });
                            }
                        } else {
                            for (const [, item] of clients.entries()) {
                                await bot.sendPhoto(item, msg.photo[msg.photo.length-1].file_id);
                            }
                        }
                    } else {
                        for (const [, item] of clients.entries()) {
                            await tgMethod.sendMessageWithRetry(item, msg.text);
                        }
                    }
                    await tgMethod.sendMessageWithRetry(chatId, `<i>Готово!</i>`);
                    bot.removeListener('message', protectionNews);
                } else {
                    console.log("Ожидание нужного пользователя для создания рассылки.")
                }
            }
            bot.on('message', protectionNews);
        } else {
            await tgMethod.sendMessageWithRetry(chatId, `<i>Клиенты не найдены.</i>`);
        }
    }

    //Сделать рассылку всем клиентам
    async makeNewsletterFrAll(chatId, clientMethod, tgMethod){
        const clients = await clientMethod.getAllClient();
        await this.makeNewsletter(chatId, clients, clientMethod, tgMethod)
    }

    //Сделать рассылку по франшизе
    async makeNewsletterFr(chatId, clientMethod, tgMethod, frMethod){
        await tgMethod.sendMessageWithRetry(chatId, "Введите название франшизы");
        const searchName = async (msg) =>{
            if (msg.chat.id === chatId) {
                const name = msg.text;
                const fr = await frMethod.searchFrOnName(name);
                if (fr){
                    bot.removeListener('text', searchName);
                    const clients = await clientMethod.getAllClientFr(fr.id);
                    await this.makeNewsletter(chatId, clients, clientMethod, tgMethod)
                } else {
                    bot.removeListener('text', searchName);
                    await tgMethod.sendMessageWithRetry(chatId, "Франшиза с таким названием не найдена");
                }
            } else {
                console.log("Ожидание нужного пользователя для ввода названия.");
            }
        }
        bot.on('text', searchName);
    }
}
export default AdminMethod;