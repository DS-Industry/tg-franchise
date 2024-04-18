import bot from "./methods/connection";
import TgMethod from "./methods/tgMethod";
import AdminMethod from "./admin/adminMethod";
import ClientMethod from "./client/clientMethod";
import FranchiseMethod from "./client/franchiseMethod";
import RequestMethod from "./client/requestMethod";
import connection from "./db";
require('dotenv').config();

const tgMethod = new TgMethod();
const adminMethod = new AdminMethod();
const clientMethod = new ClientMethod();
const franchiseMethod = new FranchiseMethod();
const requestMethod = new RequestMethod();
const usersWithMenu = [Number(process.env.ADMIN)];
const mpPres = process.env.MP_PRES;
const mpDoc = process.env.MP_DOC;
let processReq = new Map();
let surveyStates = new Map();

connection.query('CREATE TABLE IF NOT EXISTS FRANCHISE_CLIENT (ID SERIAL PRIMARY KEY, PHONE TEXT, TG_CLIENT_ID TEXT, FRANCHISE_ID INTEGER)');
connection.query('CREATE TABLE IF NOT EXISTS FRANCHISE (ID SERIAL PRIMARY KEY, NAME TEXT, CITY TEXT)');
connection.query('CREATE TABLE IF NOT EXISTS FRANCHISE_REQUEST (ID SERIAL PRIMARY KEY, CLIENT_ID TEXT, DATE TIMESTAMP, TYPE TEXT, DESCRIPTION TEXT, IS_ACTIVE INTEGER, COMMUNICATION_MODE INTEGER)');
connection.query('CREATE TABLE IF NOT EXISTS FRANCHISE_MESSAGE (ID SERIAL PRIMARY KEY, REQUEST_ID INTEGER, SENDER TEXT, DATE TIMESTAMP, TEXT TEXT)');
connection.query('CREATE TABLE IF NOT EXISTS FRANCHISE_MEDIA (ID SERIAL PRIMARY KEY, OWNER_ID INTEGER, TYPE TEXT, URL TEXT, FILLING TEXT)');

bot.on("polling_error", err => console.log(err.data.error.message));
const commands = [
    {
        command: "start",
        description: "Запуск бота"
    },
    {

        command: "help",
        description: "Раздел помощи"

    },
]

bot.setMyCommands(commands);

bot.on('message', async msg => {
    try {
        const chatId = msg.chat.id;
        const text = msg.text;
        if(await clientMethod.searchClientByTgId(chatId) || usersWithMenu.includes(chatId)) {                                               //Проверка на нахождение в системе
            if (text === '/start') {
                if (usersWithMenu.includes(chatId)) {
                     await adminMethod.menuAdminMainFixed(chatId, 'Админский чат');
                } else {
                    await clientMethod.menuMainFixed(chatId, 'Клиентский чат')
                }

            } else if (text === 'Добавить франшизу' && usersWithMenu.includes(chatId)) {                                                    //Добавить франшизу
                await adminMethod.addFrName(chatId, tgMethod, franchiseMethod);

            } else if (text === 'Добавить клиента' && usersWithMenu.includes(chatId)) {                                                     //Добавить клиента
                await adminMethod.addClientPhone(chatId, tgMethod, clientMethod, franchiseMethod);

            } else if (text === 'Активные запросы' && usersWithMenu.includes(chatId)){                                                  //Все активны запросы для админа
                await adminMethod.adminRequest(chatId, 1, '', tgMethod, requestMethod);

            } else if (text === 'Завершенные запросы' && usersWithMenu.includes(chatId)){                                                   //Все закрытые запросы для админа
                await adminMethod.adminRequest(chatId, 0, '', tgMethod, requestMethod);

            } else if (text === 'Служба поддержки' && usersWithMenu.includes(chatId)){                                              //Все актуальные запросы службе поддержки
                await adminMethod.adminRequest(chatId, 1, 'Служба поддержки', tgMethod, requestMethod);

            } else if (text === 'Бухгалтерия' && usersWithMenu.includes(chatId)){                                                //Все актуальные запросы на Бухгалтерию
                await adminMethod.adminRequest(chatId, 1, 'Бухгалтерия', tgMethod, requestMethod);

            } else if (text === 'Маркетинг' && usersWithMenu.includes(chatId)){                                                    //Все актуальные запросы на маркетинг
                await adminMethod.adminRequest(chatId, 1, 'Маркетинг', tgMethod, requestMethod);

            } else if (text === 'МП' && usersWithMenu.includes(chatId)){                                                         //Все актуальные запросы по МП
                await adminMethod.adminRequest(chatId, 1, 'Мобильное приложение', tgMethod, requestMethod);

            } else if (text === 'CW' && usersWithMenu.includes(chatId)){                                                         //Все актуальные запросы по CW
                await adminMethod.adminRequest(chatId, 1, 'Car wash', tgMethod, requestMethod);

            } else if (text === 'Отдел сервиса' && usersWithMenu.includes(chatId)){                                                //Все актуальные запросы отделу сервиса
                await adminMethod.adminRequest(chatId, 1, 'Отдел сервиса', tgMethod, requestMethod);

            } else if (text === 'Отдел продаж' && usersWithMenu.includes(chatId)){                                                 //Все актуальные запросы отделу продаж
                await adminMethod.adminRequest(chatId, 1, 'Отдел продаж', tgMethod, requestMethod);

            } else if (text === 'Договоры' && usersWithMenu.includes(chatId)){                                                  //Все актуальные запросы по Договорам
                await adminMethod.adminRequest(chatId, 1, 'Договоры', tgMethod, requestMethod);

            } else if (text === 'ЯЗ' && usersWithMenu.includes(chatId)){                                                         //Все актуальные запросы по Договорам
                await adminMethod.adminRequest(chatId, 1, 'Яндекс Заправки', tgMethod, requestMethod);

            } else if (text === '✏ Служба поддержки') {                                                                                     //Создать запрос
                surveyStates.set(chatId, true);
                await clientMethod.addReq(chatId, `Если Вы не смогли найти ответ на свой вопрос – напишите нашему специалисту. Подробно опишите проблему или интересующий вас вопрос, при необходимости прикрепите фотографию.`,
                    'Служба поддержки', '', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);

            } else if (text === '📋 Посмотреть предыдущие запросы'){                                                                         //Просмотр всех предыдущих запрсов для данного пользователя
                await clientMethod.viewRequestHistory(chatId, requestMethod, tgMethod);

            } else if (text === '📘 Бухгалтерия'){                                                                                           //Создание запроса на документы
                await clientMethod.accounting(chatId);

            } else if (text === '⛲ Отдел продаж'){                                                                                          //Меню Отдел продаж
                await clientMethod.sdMenu(chatId);

            } else if (text === '⛲ Договоры'){                                                                                              //Меню Договоров
                await clientMethod.contractMenu(chatId);

            } else if (text === '⛲ Яндекс Заправки'){                                                                                       //Меню Яндекс заправок
                await clientMethod.yaMenu(chatId);

            } else if (text === '⛲ Маркетинг'){                                                                                             //Меню маркетинга
                await clientMethod.marketing(chatId);

            } else if (text === '⛲ Car wash'){                                                                                              //Меню carWash
                await clientMethod.cwMenu(chatId);

            } else if (text === '⛲ Отдел сервиса'){                                                                                         //Меню отдела сервиса
                surveyStates.set(chatId, true);
            await clientMethod.addReq(chatId, `Чем я могу Вам помочь?`, 'Отдел сервиса', '', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);

            } else if (text === '📱 Мобильное приложение'){                                                                                  //Меню мобильного приложения
                await clientMethod.phoneMenu(chatId);

            } else if (text === 'Сделать рассылку' && usersWithMenu.includes(chatId)){                                                 //Сделать рассылку все клиентам
                await adminMethod.makeNewsletterFrAll(usersWithMenu[0], clientMethod, tgMethod);

            }/* else if (text === 'Сделать рассылку франшизе' && usersWithMenu.includes(chatId)){                                             //Сделать рассылку франшизе
                await adminMethod.makeNewsletterFr(usersWithMenu[0], clientMethod, tgMethod, franchiseMethod);

            }*/ else if (chatId === usersWithMenu[0] && tgMethod.isNumeric(text)){                                                            //Поиск конкретного запроса по id для админа
                await adminMethod.searchRequestById(chatId, text, tgMethod, clientMethod, franchiseMethod, requestMethod);

            } else if (chatId !== usersWithMenu[0] && !surveyStates.get(chatId) && !tgMethod.isNumeric(text)) {                             //Режим свободного комментария для клиента
                const client = await clientMethod.searchClientByTgId(chatId)
                const comReq = await requestMethod.searchComMod(client.id);
                if (comReq) {
                    await requestMethod.sendComment(comReq, msg, "Клиент", usersWithMenu[0], tgMethod);
                } else {
                    await tgMethod.sendMessageWithRetry(chatId, `<i>В данный момент вы не находитесь в режиме общения. Создайте новый запрос.</i>`);
                }
            }

        } else if(!processReq.get(msg.chat.id)) {                                                                                           //Проверка на нахождение в режиме регистрации
            processReq.set(msg.chat.id, true);
            await clientMethod.registration(msg.chat.id, tgMethod, franchiseMethod, processReq);
        }
    } catch(error) {
        console.log(error);
    }
})

bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data.split(':');
    const chatId = callbackQuery.message.chat.id;
    const messId = callbackQuery.message.message_id;

    if (action[0] === 'marketingYes') {                                                                                                     //Маркетинг выбор Да
        await clientMethod.marketingYes(chatId, 'Маркетинг', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'marketingNo') {                                                                                               //Маркетинг выбор Нет
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `Что Вас интересует?`, 'Маркетинг', '', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'accounting') {                                                                                             //Короткие запросы по Яндекс Заправкам
        surveyStates.set(chatId, true);
        let addDesc = ''
        if (action[1] === '1'){
            addDesc = addDesc + 'Счета. ';
        } else if (action[1] === '2'){
            addDesc = addDesc + 'Активы. ';
        } else if (action[1] === '3'){
            addDesc = addDesc + 'Отчет комитенту. ';
        } else if (action[1] === '4'){
            addDesc = addDesc + 'УПД. ';
        } else if (action[1] === '5'){
            addDesc = addDesc + 'Акты сверки. ';
        } else if (action[1] === '6'){
            addDesc = addDesc + 'Яндекс Заправки. ';
        }
        await tgMethod.sendMessageWithRetry(chatId, 'По какому договору выгрузить документ?');
        const addText = async (msg) =>{
            if (msg.chat.id === chatId) {
                bot.removeListener('message', addText);
                addDesc = addDesc + msg.text;
                await clientMethod.addReq(chatId,`Укажите год и месяц (при необходимости укажите временной период):`, 'Бухгалтерия',
                    addDesc + '. Период: ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
                await bot.deleteMessage(chatId, messId);
            } else {
                console.log("Ожидание нужного пользователя для ввода описания.");
            }
        }
        bot.on('message', addText);

    } else if (action[0] === 'mobReq') {                                                                                                    //Запрос по мп
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `Напишите подробно свой вопрос. Добавьте фото при необходимости. Мы постараемся Вам помочь.`,
            'Мобильное приложение', '', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'claimClient') {                                                                                               //Запрос - жалоба клиента
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `На что жалуется клиент? Укажите номер карты или мобильный номер телефона. Мы постараемся Вам помочь.`,
            'Мобильное приложение', 'Жалоба клиента. ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'plug') {                                                                                                      //Меню подключения мп
        await clientMethod.plugMenu(chatId);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'pres') {                                                                                                      //Презентация мп
        await bot.sendDocument(chatId, mpPres);

    } else if (action[0] === 'doc') {                                                                                                       //Договор мп
        await bot.sendDocument(chatId, mpDoc);

    } else if (action[0] === 'cwReq') {                                                                                                     //Запрос по CW
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `Напишите подробно свой вопрос. Добавьте  скриншот из Car Wash при необходимости. Мы постараемся Вам помочь.`,
            'Car wash', '', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'manual') {                                                                                                    //Инструкции по CW
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `По какому разделу Вы хотели бы просмотреть инструкцию?`, 'Car wash. Инструкции', 'Раздел CW, по которому требуется инструкция. ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'registrationForTraining') {                                                                                   //Обучение по CW
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `Если у Вас возникают сложности в программе Car Wash – предлагаем Вам записаться на обучение. Обучение проводят ведущие специалисты МОЙ-КА!DS в формате Zoom (онлайн). По окончанию обучения у Вас остается видеозапись, которую Вы всегда сможете просмотреть. Для оформления заявки на обучение, укажите какие разделы Вы хотели бы изучить. Специалисты свяжутся с Вами и подберут удобную дату и время.`,
            'Car wash. Обучение', 'Данные по заявке на обучение. ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'sdAutochemistry') {                                                                                           //Обучение по CW
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId, `Укажите название Автохимии, количество и объем канистр, дату доставки.`,
            'Отдел продаж','Автохимия. ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'sdEquipment') {                                                                                               //Обучение по CW
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId,  `Укажите, какие запчасти/оборудование Вам нужно?`,
            'Отдел продаж','Оборудование. ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'sdOther') {                                                                                                   //Обучение по CW
        surveyStates.set(chatId, true);
        await clientMethod.addReq(chatId,  `Что Вы хотите купить?`,
            'Отдел продаж','Другое. ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'contract') {                                                                                                  //Запрос по Договору
        surveyStates.set(chatId, true);
        let addDesc = 'Договор коммерческой концессии. ';
        if (action[1] === '2'){
            addDesc = 'Агентский договор. ';
        } else if (action[1] === '3'){
            addDesc = 'Договор на ПО/ПЛ. ';
        } else if (action[1] === '4'){
            addDesc = 'Договор на Мобильное приложение. ';
        }
        await clientMethod.addReq(chatId, `Какой у Вас вопрос?`,
            'Договоры', addDesc, tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'yaReq') {                                                                                                     //Запрос по Яндекс Заправкам
        surveyStates.set(chatId, true);
        let text = `Какой у Вас вопрос?`;
        let addDesc = 'Договор. ';
        if (action[1] === '2'){
            text = 'Что у Вас не работает?';
            addDesc = 'Проблемы с приложением. ';
        } else if(action[1] === '3'){
            text = 'Укажите дополнительный комментарий (если не нужен, напишите -)';
            addDesc = 'Подключить Яндекс заправки. ';
        }
        await clientMethod.addReq(chatId, text,
            'Яндекс Заправки', addDesc, tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'yaShort') {                                                                                                   //Короткие запросы по Яндекс Заправкам
        surveyStates.set(chatId, true);
        let addDesc = 'Отчет комитенту';
        if (action[1] === '2'){
            addDesc = 'УПД';
        }
        await clientMethod.addReq(chatId,  `Укажите год и месяц:`,'Яндекс Заправки. ' + addDesc,
            'Год и месяц: ', tgMethod, requestMethod, adminMethod, clientMethod, franchiseMethod, surveyStates, usersWithMenu[0]);
        await bot.deleteMessage(chatId, messId);

    } else if (action[0] === 'addComment') {                                                                                                //Добавление комментария к запросу
        await adminMethod.sendCommentAdmin(action[1], usersWithMenu[0], clientMethod, requestMethod, tgMethod);

    } else if (action[0] === 'closeAdminStatus') {                                                                                          //Изменение статуса запроса для админа на "Закрыто"
        await adminMethod.closeReq(action[1], usersWithMenu[0], tgMethod, clientMethod, requestMethod);

    } else if (action[0] === 'historyComment') {                                                                                            //Просмотр истории комментариев по данному запросу
        await requestMethod.viewHistoryComment(chatId, action[1], tgMethod);

    } else if (action[0] === 'requestHistory') {                                                                                            //Просмотр всех предыдущих запрсов для данного пользователя
        await clientMethod.viewRequestHistory(chatId, requestMethod, tgMethod);

    } else if (action[0] === 'sendShortComment') {                                                                                          //Отправка комментария на короткий запрос
        await adminMethod.sendCommentAdminShort(action[1], usersWithMenu[0], clientMethod, requestMethod, tgMethod);

    } else if (action[0] === 'communicationMode') {                                                                                         //Переход к режиму общения для данного запроса
        await clientMethod.onCommunicationMode(chatId, action[1], requestMethod, tgMethod);
    }
})