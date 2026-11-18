import { useSyncExternalStore } from 'react'

// Three languages. The English text is the key: a missing translation simply shows English.
// Manga SFX (DOOOM, BANG!) and the logo stay as they are on purpose — they're the art.
export type Lang = 'en' | 'ru' | 'ja'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'RU' },
  { id: 'ja', label: '日本語' },
]

type Dict = Record<string, string>

const RU: Dict = {
  // tabs & header
  'CHATS': 'ЧАТЫ', 'ROOMS': 'КОМНАТЫ', 'SETTINGS': 'НАСТРОЙКИ', 'PROFILE': 'ПРОФИЛЬ',
  'CALL': 'ЗВОНОК', 'JOIN CALL ({n})': 'В ЗВОНОК ({n})', 'JOIN ({n})': 'ЗВОНОК ({n})',
  'NEGATIVE': 'НЕГАТИВ', 'PAPER': 'БУМАГА', 'CHAPTER {n} — {name}': 'ГЛАВА {n} — {name}',
  'Room: cast, code, settings (Alt+I)': 'Комната: участники, код, настройки (Alt+I)',
  'Save the chapter as a manga page (Alt+E)': 'Сохранить главу как страницу манги (Alt+E)',
  'Search this room (Ctrl+K)': 'Поиск по комнате (Ctrl+K)',
  // input
  'Your line…': 'Твоя реплика…', 'Your line in {room}…': 'Твоя реплика в {room}…',
  'Enter — send · Shift+Enter — newline': 'Enter — отправить · Shift+Enter — новая строка',
  'Ctrl+Enter — send · Enter — newline': 'Ctrl+Enter — отправить · Enter — новая строка',
  'DROP THE PANEL!': 'КИДАЙ ПАНЕЛЬ!', 'EDITING': 'ПРАВКА',
  'Attach a picture (or paste / drop it)': 'Прикрепить картинку (или вставь / перетащи)',
  // rooms tab
  'CONTENTS': 'ОГЛАВЛЕНИЕ', 'CHAPTER': 'ГЛАВА', 'CHAPTERS': 'ГЛАВ',
  'NEW CHAPTER': 'НОВАЯ ГЛАВА', 'start a room, get an invite code': 'создай комнату и получи код',
  'ENTER BY CODE': 'ВОЙТИ ПО КОДУ', 'a friend sent you a code': 'друг прислал тебе код',
  'CHAPTER TITLE (OPTIONAL)': 'НАЗВАНИЕ ГЛАВЫ (НЕОБЯЗАТЕЛЬНО)', 'CREATE': 'СОЗДАТЬ', 'ENTER': 'ВОЙТИ',
'CODE': 'КОД',
  // settings
  'PAGE': 'СТРАНИЦА', 'SYSTEM': 'СИСТЕМА', 'LETTERING': 'ШРИФТ', 'STICKERBOMB': 'СТИКЕРЫ', 'SOUND & FX': 'ЗВУК И ЭФФЕКТЫ',
  'CHAINSAW SOUNDS': 'ЗВУКИ ПИЛЫ', 'roar at startup and on CAPS LOCK': 'рёв при старте и на CAPS LOCK',
  'MANGA SFX': 'МАНГА-SFX', 'DOOOM on caps, DON on send, ZAP! on join': 'DOOOM на капсе, DON при отправке, ZAP! при входе',
  'BERSERK MODE': 'РЕЖИМ БЕРСЕРКА', 'message bursts rev a tachometer in the corner': 'серии сообщений раскручивают тахометр в углу',
  'POCHITA HEARTS': 'СЕРДЕЧКИ ПОЧИТЫ', 'hearts rain on cute words': 'сердечки на милые слова',
  'CONTROLS & PRIVACY': 'УПРАВЛЕНИЕ И ПРИВАТНОСТЬ', 'ENTER SENDS': 'ENTER ОТПРАВЛЯЕТ',
  'Shift+Enter — new line': 'Shift+Enter — новая строка', 'Ctrl+Enter sends, Enter — new line': 'Ctrl+Enter отправляет, Enter — новая строка',
  "SHOW I'M TYPING": 'ПОКАЗЫВАТЬ, ЧТО Я ПИШУ', 'others see your thought balloon': 'другие видят твоё облачко мыслей', 'you type in secret': 'пишешь тайком',
  'PUSH WHEN CLOSED': 'PUSH, КОГДА ЗАКРЫТО', 'needs an account (guests vanish with the tab)': 'нужен аккаунт (гость исчезает вместе со вкладкой)',
  'not in this browser — on iPhone add the app to the Home Screen': 'не в этом браузере — на iPhone добавь приложение на экран «Домой»',
  'a ping on your phone even with the app closed': 'уведомление на телефон, даже когда приложение закрыто',
  'sign in with an account first': 'сначала войди в аккаунт', 'on — try it: close the tab and ask a friend to write': 'включено — закрой вкладку и попроси друга написать',
  'BACKGROUND ALERTS': 'УВЕДОМЛЕНИЯ В ФОНЕ', 'a notification when the tab is hidden': 'уведомление, когда вкладка скрыта', 'only the (3) counter on the tab': 'только счётчик (3) на вкладке',
  'TOUR': 'ЭКСКУРСИЯ', 'LANGUAGE': 'ЯЗЫК', 'clean page': 'чистая страница',
  // menus & panels
  'REPLY ↩': 'ОТВЕТИТЬ ↩', 'EDIT ✎': 'ИЗМЕНИТЬ ✎', 'DELETE 🗑️': 'УДАЛИТЬ 🗑️', 'COPY 📋': 'КОПИРОВАТЬ 📋',
  'Search in {room}…': 'Поиск в {room}…', 'Type 2+ letters.': 'Введи хотя бы 2 буквы.', 'Nothing. Maybe the devil ate it.': 'Ничего. Может, демон съел.',
  'Chapter title': 'Название главы', 'RENAME': 'ПЕРЕИМЕНОВАТЬ', 'Invite code': 'Код приглашения', 'COPY': 'КОПИРОВАТЬ', 'COPIED': 'СКОПИРОВАНО',
  'CAST': 'СОСТАВ', '({n} online)': '({n} онлайн)', 'founder': 'основатель', 'you': 'ты', 'KICK': 'ВЫГНАТЬ', 'SURE?': 'ТОЧНО?',
  'LEAVE': 'ВЫЙТИ', 'LEAVE FOR GOOD?': 'ВЫЙТИ НАСОВСЕМ?', 'DELETE CHAPTER': 'УДАЛИТЬ ГЛАВУ', 'BURN IT ALL?': 'СЖЕЧЬ ВСЁ?',
  "The lobby is open to everyone; you can't leave or delete it.": 'Лобби открыто всем: из него нельзя выйти, его нельзя удалить.',
  'SAVE THE CHAPTER': 'СОХРАНИТЬ ГЛАВУ', 'LAST {n} LINES': 'ПОСЛЕДНИЕ {n} РЕПЛИК', 'WHOLE CHAPTER ({n})': 'ВСЯ ГЛАВА ({n})',
  'Inking the panels…': 'Обвожу панели тушью…', 'page {a} / {b}': 'стр. {a} / {b}', 'INKING…': 'ТУШЬ…',
  'KEYS 鍵': 'КЛАВИШИ 鍵',
  // shortcuts
  'jump to chapter (room) 1–9': 'перейти к главе (комнате) 1–9', 'Chat · Rooms · Settings · Profile': 'Чат · Комнаты · Настройки · Профиль',
  'search this room': 'поиск по комнате', 'save the chapter as a manga page': 'сохранить главу как страницу манги',
  'room: cast, invite code, rename / leave': 'комната: состав, код, переименовать / выйти',
  'reply to the last message': 'ответить на последнее сообщение', 'edit your last line': 'изменить свою последнюю реплику',
  'cancel the reply / close a panel': 'отменить ответ / закрыть панель', 'hide the selection as a ||spoiler||': 'спрятать выделенное как ||спойлер||',
  'reply to it / edit it (yours)': 'ответить / изменить (своё)', 'its menu (react, copy, pin, delete)': 'его меню (реакция, копировать, удалить)',
  'this page': 'эта страница', '↑ in an empty line': '↑ в пустой строке', 'Tab to a balloon, then R / E': 'Tab до бабла, затем R / E', 'Tab to a balloon, then Enter': 'Tab до бабла, затем Enter',
  // system lines & notices
  '{who} joined the room': '{who} заходит в комнату', '{who} left the room': '{who} выходит из комнаты', '{who} was kicked out': '{who} выгнали',
  'That line is gone': 'Этой реплики больше нет', 'Turning back the pages…': 'Листаю назад…',
  'You were kicked out of {room}': 'Тебя выгнали из {room}', '{room} was deleted': '{room} удалена', 'There is no chapter {n}': 'Главы {n} нет',
  '⚠ CONNECTION LOST — RECONNECTING… (messages will wait)': '⚠ СВЯЗЬ ПОТЕРЯНА — ПЕРЕПОДКЛЮЧАЮСЬ… (сообщения подождут)',
  'SERVER ENGINE IS COLD — WARMING UP {s}s': 'ДВИГАТЕЛЬ СЕРВЕРА ХОЛОДНЫЙ — ПРОГРЕВ {s} с', 'SERVER READY': 'СЕРВЕР ГОТОВ',
  "THE SERVER WON'T START — TRY AGAIN LATER": 'СЕРВЕР НЕ ЗАВОДИТСЯ — ПОПРОБУЙ ПОЗЖЕ',
  "free hosting naps when nobody's around — usually under a minute": 'бесплатный хостинг засыпает без людей — обычно меньше минуты',
  // contracts
  'CONTRACT 契約': 'КОНТРАКТ 契約', 'VOTE 投票': 'ГОЛОСОВАНИЕ 投票', 'SEALED': 'ЗАПЕЧАТАНО', '{n} seals': 'печатей: {n}', '{n} seal': 'печатей: {n}',
  'SIGN IN BLOOD': 'ПОДПИСАТЬ КРОВЬЮ', 'SIGNED': 'ПОДПИСАНО', 'close the contract': 'закрыть контракт', 'close the vote': 'закрыть голосование',
  // tour
  'WOOF! WELCOME': 'ГАВ! ДОБРО ПОЖАЛОВАТЬ', "This is Chainsaw Chat. Let me show you around — it takes 30 seconds, promise.": 'Это Chainsaw Chat. Покажу, что тут где — 30 секунд, честно.',
  "Every chat lives in a room. Make your own or join a friend's with an invite code from the ROOMS tab.": 'Каждый чат живёт в комнате. Создай свою или войди к другу по коду во вкладке КОМНАТЫ.',
  'TALK': 'ГОВОРИ', 'Type here and hit Enter to send. Turn on CAPS LOCK if you want the chainsaw to roar.': 'Пиши здесь и жми Enter. Включи CAPS LOCK, если хочешь, чтобы пила взревела.',
  'VOICE MESSAGES': 'ГОЛОСОВЫЕ', 'Hold this button to record. Let go and it sends.': 'Держи кнопку, чтобы записать. Отпустишь — отправится.',
  'REACT & MORE': 'РЕАКЦИИ И НЕ ТОЛЬКО', 'Right-click a message (long-press on phone) to react, edit, pin or delete. Double-click to give a like.': 'Правый клик по сообщению (долгое нажатие на телефоне): реакция, правка, удаление. Двойной клик — лайк.',
  'VIDEO CALLS': 'ВИДЕОЗВОНКИ', 'Start a call for everyone in this room. Up to 4 devil hunters at once.': 'Звонок для всей комнаты. До 4 охотников на демонов сразу.',
  'Theme, sounds and how many stickers get slapped on the walls. You can replay this tour from there too.': 'Тема, звуки и сколько стикеров клеить на стены. Отсюда же можно повторить экскурсию.',
  "YOU'RE READY": 'ТЫ ГОТОВ', "That's everything. Now go make some noise.": 'Вот и всё. Иди пошуми.',
  'NEXT': 'ДАЛЕЕ', 'ON': 'ВКЛ', 'SMALL': 'МЕЛКИЙ', 'MEDIUM': 'СРЕДНИЙ', 'LARGE': 'КРУПНЫЙ', 'you are reading this': 'ты читаешь это', 'CHAPTERS_TITLE': 'ГЛАВЫ', 'OFF': 'ВЫКЛ', 'LIGHT': 'ЧУТЬ', 'FULL': 'ВЕЗДЕ', 'S': 'S', 'M': 'M', 'L': 'L', 'Upload failed': 'Не удалось загрузить', 'BACK': 'НАЗАД', 'SKIP': 'ПРОПУСТИТЬ', 'DONE': 'ГОТОВО',
  // companions
  'COMPANION': 'КОМПАНЬОН', 'INK IMP': 'ЧЕРНИЛЬНЫЙ БЕС', 'STATIC DEVIL': 'ДЕМОН ПОМЕХ', 'SEAL DEVIL': 'ДЕМОН ПЕЧАТИ',
  'a blot that dozes off when the chat goes quiet': 'клякса, которая засыпает, когда в чате тихо',
  'an old TV that turns to snow when the line drops': 'старый телик, который рябит, когда пропадает связь',
  'a hanko stamp that stamps along to your CAPS': 'печать-ханко, которая топает в такт твоему капсу',
  'a contract devil peeks over the input bar: dozes when it is quiet, rages at CAPS, listens to voice notes, panics when the line drops. Write “nom” and it eats the narration boxes.': 'контрактный демон выглядывает из-за поля ввода: спит, когда тихо, бесится на капс, слушает голосовые, паникует, когда пропадает связь. Напиши «ням» — и он съест системные плашки.',
  'Where did the server go?!': 'Куда делся сервер?!', 'Poke it': 'Ткни его', 'Your companion — poke it': 'Твой компаньон — ткни его',
  '…nothing to eat.': '…а есть-то нечего.', 'THE PAGE IS BLANK': 'СТРАНИЦА ПУСТА', 'draw the first panel — say something': 'нарисуй первый кадр — напиши что-нибудь',
}

const JA: Dict = {
  'CHATS': 'チャット', 'ROOMS': 'ルーム', 'SETTINGS': '設定', 'PROFILE': 'プロフィール',
  'CALL': '通話', 'JOIN CALL ({n})': '通話に参加 ({n})', 'JOIN ({n})': '参加 ({n})',
  'NEGATIVE': 'ネガ', 'PAPER': '紙', 'CHAPTER {n} — {name}': '第{n}話 — {name}',
  'Room: cast, code, settings (Alt+I)': 'ルーム：メンバー・コード・設定 (Alt+I)',
  'Save the chapter as a manga page (Alt+E)': 'この話を漫画のページとして保存 (Alt+E)',
  'Search this room (Ctrl+K)': 'このルームを検索 (Ctrl+K)',
  'Your line…': 'セリフを入力…', 'Your line in {room}…': '{room} にセリフを入力…',
  'Enter — send · Shift+Enter — newline': 'Enter — 送信 · Shift+Enter — 改行',
  'Ctrl+Enter — send · Enter — newline': 'Ctrl+Enter — 送信 · Enter — 改行',
  'DROP THE PANEL!': 'コマをドロップ！', 'EDITING': '編集中',
  'Attach a picture (or paste / drop it)': '画像を添付（貼り付け・ドロップも可）',
  'CONTENTS': '目次', 'CHAPTER': '話', 'CHAPTERS': '話',
  'NEW CHAPTER': '新しい話', 'start a room, get an invite code': 'ルームを作って招待コードを入手',
  'ENTER BY CODE': 'コードで入る', 'a friend sent you a code': '友だちからコードをもらった',
  'CHAPTER TITLE (OPTIONAL)': '話のタイトル（任意）', 'CREATE': '作成', 'ENTER': '入る',
'CODE': 'コード',
  'PAGE': 'ページ', 'SYSTEM': 'システム', 'LETTERING': '写植', 'STICKERBOMB': 'ステッカー', 'SOUND & FX': '音と効果',
  'CHAINSAW SOUNDS': 'チェンソーの音', 'roar at startup and on CAPS LOCK': '起動時と CAPS LOCK で唸る',
  'MANGA SFX': '描き文字', 'DOOOM on caps, DON on send, ZAP! on join': '大文字で DOOOM、送信で DON、入室で ZAP!',
  'BERSERK MODE': 'バーサークモード', 'message bursts rev a tachometer in the corner': '連続メッセージで隅のタコメーターが回る',
  'POCHITA HEARTS': 'ポチタのハート', 'hearts rain on cute words': 'かわいい言葉でハートが降る',
  'CONTROLS & PRIVACY': '操作とプライバシー', 'ENTER SENDS': 'ENTER で送信',
  'Shift+Enter — new line': 'Shift+Enter — 改行', 'Ctrl+Enter sends, Enter — new line': 'Ctrl+Enter で送信、Enter で改行',
  "SHOW I'M TYPING": '入力中を表示', 'others see your thought balloon': '考え中のフキダシが見える', 'you type in secret': 'こっそり入力',
  'PUSH WHEN CLOSED': '閉じていても通知', 'needs an account (guests vanish with the tab)': 'アカウントが必要（ゲストはタブと一緒に消えます）',
  'not in this browser — on iPhone add the app to the Home Screen': 'このブラウザは非対応 — iPhone はホーム画面に追加してください',
  'a ping on your phone even with the app closed': 'アプリを閉じていてもスマホに通知',
  'sign in with an account first': '先にアカウントでログインしてください', 'on — try it: close the tab and ask a friend to write': 'オン — タブを閉じて友だちに書いてもらおう',
  'BACKGROUND ALERTS': 'バックグラウンド通知', 'a notification when the tab is hidden': 'タブが隠れているときに通知', 'only the (3) counter on the tab': 'タブの (3) カウンターだけ',
  'TOUR': 'ツアー', 'LANGUAGE': '言語', 'clean page': '白いページ',
  'REPLY ↩': '返信 ↩', 'EDIT ✎': '編集 ✎', 'DELETE 🗑️': '削除 🗑️', 'COPY 📋': 'コピー 📋',
  'Search in {room}…': '{room} を検索…', 'Type 2+ letters.': '2文字以上入力してください。', 'Nothing. Maybe the devil ate it.': '見つからない。悪魔が食べたのかも。',
  'Chapter title': '話のタイトル', 'RENAME': '名前を変更', 'Invite code': '招待コード', 'COPY': 'コピー', 'COPIED': 'コピーしました',
  'CAST': '登場人物', '({n} online)': '（{n}人オンライン）', 'founder': '作成者', 'you': 'あなた', 'KICK': '追い出す', 'SURE?': '本当に？',
  'LEAVE': '退出', 'LEAVE FOR GOOD?': '本当に退出？', 'DELETE CHAPTER': '話を削除', 'BURN IT ALL?': '全部燃やす？',
  "The lobby is open to everyone; you can't leave or delete it.": 'ロビーは全員に開かれています。退出も削除もできません。',
  'SAVE THE CHAPTER': '話を保存', 'LAST {n} LINES': '最新 {n} 件', 'WHOLE CHAPTER ({n})': '話全体 ({n})',
  'Inking the panels…': 'コマにペン入れ中…', 'page {a} / {b}': '{a} / {b} ページ', 'INKING…': 'ペン入れ中…',
  'KEYS 鍵': 'ショートカット 鍵',
  'jump to chapter (room) 1–9': '第1〜9話（ルーム）へ移動', 'Chat · Rooms · Settings · Profile': 'チャット・ルーム・設定・プロフィール',
  'search this room': 'ルームを検索', 'save the chapter as a manga page': '話を漫画のページとして保存',
  'room: cast, invite code, rename / leave': 'ルーム：メンバー・招待コード・名前変更・退出',
  'reply to the last message': '最新のメッセージに返信', 'edit your last line': '自分の最新のセリフを編集',
  'cancel the reply / close a panel': '返信をやめる・パネルを閉じる', 'hide the selection as a ||spoiler||': '選択部分を ||ネタバレ|| にする',
  'reply to it / edit it (yours)': '返信・編集（自分のもの）', 'its menu (react, copy, pin, delete)': 'メニュー（リアクション・コピー・削除）',
  'this page': 'このページ', '↑ in an empty line': '空欄で ↑', 'Tab to a balloon, then R / E': 'Tab でフキダシへ、R / E', 'Tab to a balloon, then Enter': 'Tab でフキダシへ、Enter',
  '{who} joined the room': '{who} が入室しました', '{who} left the room': '{who} が退出しました', '{who} was kicked out': '{who} が追い出されました',
  'That line is gone': 'そのセリフはもうありません', 'Turning back the pages…': 'ページをさかのぼっています…',
  'You were kicked out of {room}': '{room} から追い出されました', '{room} was deleted': '{room} は削除されました', 'There is no chapter {n}': '第{n}話はありません',
  '⚠ CONNECTION LOST — RECONNECTING… (messages will wait)': '⚠ 接続が切れました — 再接続中…（メッセージは待機）',
  'SERVER ENGINE IS COLD — WARMING UP {s}s': 'サーバーのエンジンが冷えています — 暖機中 {s}秒', 'SERVER READY': 'サーバー準備完了',
  "THE SERVER WON'T START — TRY AGAIN LATER": 'サーバーが起動しません — 後でもう一度',
  "free hosting naps when nobody's around — usually under a minute": '無料サーバーは誰もいないと眠ります — たいてい1分以内',
  'CONTRACT 契約': '契約', 'VOTE 投票': '投票', 'SEALED': '締結済み', '{n} seals': '印 {n}', '{n} seal': '印 {n}',
  'SIGN IN BLOOD': '血判を押す', 'SIGNED': '署名済み', 'close the contract': '契約を締め切る', 'close the vote': '投票を締め切る',
  'WOOF! WELCOME': 'ワン！ようこそ', "This is Chainsaw Chat. Let me show you around — it takes 30 seconds, promise.": 'ここは Chainsaw Chat。30秒で案内します。',
  "Every chat lives in a room. Make your own or join a friend's with an invite code from the ROOMS tab.": 'チャットはルームの中にあります。ルームタブで作るか、招待コードで友だちのルームに入ろう。',
  'TALK': '話す', 'Type here and hit Enter to send. Turn on CAPS LOCK if you want the chainsaw to roar.': 'ここに入力して Enter で送信。CAPS LOCK でチェンソーが唸ります。',
  'VOICE MESSAGES': 'ボイスメッセージ', 'Hold this button to record. Let go and it sends.': '押している間だけ録音。離すと送信。',
  'REACT & MORE': 'リアクションなど', 'Right-click a message (long-press on phone) to react, edit, pin or delete. Double-click to give a like.': 'メッセージを右クリック（スマホは長押し）でリアクション・編集・削除。ダブルクリックでいいね。',
  'VIDEO CALLS': 'ビデオ通話', 'Start a call for everyone in this room. Up to 4 devil hunters at once.': 'ルーム全員で通話。デビルハンター4人まで。',
  'Theme, sounds and how many stickers get slapped on the walls. You can replay this tour from there too.': 'テーマ、音、ステッカーの量。ツアーもここから見直せます。',
  "YOU'RE READY": '準備完了', "That's everything. Now go make some noise.": 'これで全部。さあ、騒ごう。',
  'NEXT': '次へ', 'ON': 'オン', 'SMALL': '小', 'MEDIUM': '中', 'LARGE': '大', 'you are reading this': '今読んでいる', 'CHAPTERS_TITLE': '目次', 'OFF': 'オフ', 'LIGHT': '少なめ', 'FULL': '全面', 'Upload failed': 'アップロードに失敗しました', 'BACK': '戻る', 'SKIP': 'スキップ', 'DONE': '完了',
  // companions
  'COMPANION': '相棒', 'INK IMP': 'インクの小鬼', 'STATIC DEVIL': '砂嵐の悪魔', 'SEAL DEVIL': '判子の悪魔',
  'a blot that dozes off when the chat goes quiet': 'チャットが静かになると居眠りするインクのしみ',
  'an old TV that turns to snow when the line drops': '回線が切れると砂嵐になる古いテレビ',
  'a hanko stamp that stamps along to your CAPS': '大文字に合わせてドンと押す判子',
  'a contract devil peeks over the input bar: dozes when it is quiet, rages at CAPS, listens to voice notes, panics when the line drops. Write “nom” and it eats the narration boxes.': '契約悪魔が入力欄から顔を出す：静かだと眠り、大文字で暴れ、ボイスを聞き、回線が切れると慌てる。「いただきます」と書くとナレーションを食べる。',
  'Where did the server go?!': 'サーバーどこ行った？！', 'Poke it': 'つつく', 'Your companion — poke it': '相棒 — つついてみて',
  '…nothing to eat.': '…食べるものがない。', 'THE PAGE IS BLANK': 'まっさらなページ', 'draw the first panel — say something': '最初のコマを描こう — 何か書いて',
}

const DICTS: Record<Lang, Dict> = { en: { CHAPTERS_TITLE: 'CHAPTERS' }, ru: RU, ja: JA }

const KEY = 'chainsaw_lang'
function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'ru' || saved === 'ja') return saved
  } catch { /* private mode */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase()
  return nav.startsWith('ru') ? 'ru' : nav.startsWith('ja') ? 'ja' : 'en'
}

let lang: Lang = detect()
const listeners = new Set<() => void>()
if (typeof document !== 'undefined') document.documentElement.lang = lang

export function setLang(next: Lang) {
  lang = next
  try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
  document.documentElement.lang = next
  listeners.forEach(f => f())
}
export const getLang = () => lang

// t('CHAPTER {n} — {name}', { n: 2, name: '# SQUAD' })
export function t(key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

// re-renders the component when the language changes
export function useT(): typeof t {
  useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => lang,
    () => lang,
  )
  return t
}
