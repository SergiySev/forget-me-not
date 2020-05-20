const throttle = (callback, limit) => {
  let wait = false;
  return function () {
    if (!wait) {
      callback.call();
      wait = true;
      setTimeout(() => {wait = false}, limit);
    }
  }
}

const getMainParent = (elem) => {
  return elem
    .parentElement.parentElement.parentElement
    .parentElement.parentElement.parentElement;
}

const deleteUsedDetection = (oldValues, newValues, key) => {
  if (!oldValues || !newValues) return [];

  return oldValues.filter(firstArrayItem =>
    !newValues.some(
      secondArrayItem => firstArrayItem[key] === secondArrayItem[key]
    )
  );
};

const cleanUpDeletedUser = (deletedUsers) => {
  deletedUsers.forEach(user => markUser(user, true));
}

const storageUpdate = (chatId, cb) => {
  const saveToStorage = (userList, chatId) => (newUser) => {
    userList.unshift({color: '#FF0000', ignore: false, ...newUser});
    chrome.storage.sync.set({ [chatId]: userList });
  }

  chrome.storage.onChanged.addListener((changes) => {
    const storageChange = changes[chatId];
    if (storageChange) {
      let deletedUsers = deleteUsedDetection(storageChange.oldValue, storageChange.newValue, 'id');
      cleanUpDeletedUser(deletedUsers);
      let updatedList = storageChange.newValue;
      cb(updatedList, saveToStorage(updatedList, chatId));
    }
  });

  chrome.storage.sync.get([chatId], (result) => {
    let updatedList = result[chatId] || [];
    cb(updatedList, saveToStorage(updatedList, chatId));
  });
}

const KEY = 'l';
let MARK_MODE_ON = false;
const onKeyCombination = (e, saveToStorage) => {
  const messageSelector = 'a.c-message__sender_link';
  const messageHolderSelector = '.p-message_pane.p-message_pane--classic-nav';

  function fn (event) {
    if (!event.target.matches(messageSelector)) {
      MARK_MODE_ON = false;
      this.setAttribute('style', '');
      this.removeEventListener('click', arguments.callee, false);
      return;
    }
    event.stopImmediatePropagation();
    event.preventDefault();

    const target = event.target;
    if (target.dataset && target.dataset.messageSender) {
      const userId = target.dataset.messageSender;
      const user = target.innerText;

      if (userId) {
        saveToStorage({id: userId, name: user});
      }
    }

    MARK_MODE_ON = false;
    this.setAttribute('style', '');
    this.removeEventListener('click', arguments.callee, false);
  }

  if (e.ctrlKey && e.shiftKey && e.metaKey && e.key.toLowerCase() === KEY) {
    MARK_MODE_ON = !MARK_MODE_ON;

    //const messagesHolder =  document.querySelectorAll(messageHolderSelector)[0];
    const messagesHolder =  document.querySelector('body');
    if (MARK_MODE_ON) {
      messagesHolder.setAttribute('style', 'border: 6px dashed red');
      messagesHolder.addEventListener('click', fn, false);
    } else {
      messagesHolder.setAttribute('style', '');
    }
  }
}

const markUser = (user, clearStyles) => {
  let elements = Array.from(document.querySelectorAll(`[data-message-sender="${user.id}"]`));

  if (elements) {
    elements.forEach( (userNameContainer) => {
      const message = getMainParent(userNameContainer);
      // const container = message.parentElement;

      if (clearStyles) {
        message.setAttribute('style', '');
      } else {
        message.setAttribute('style', `background: ${user.color}`);
        if (user.ignore) {
          message.setAttribute("style", `display: none`);
        }
      }
    })
  }
}

const watchDOMChanges = (list) => {
  const scrollContainerSelector = 'body';
  const config = {
    attributes: false,
    characterData: false,
    childList: true
  };

  // 0 - navigation panel, 1 - messages list
  const messagesBody = document.querySelectorAll(scrollContainerSelector)[0];
  const updateStyles = () => list.forEach(user => markUser(user, false));
  const observer = new MutationObserver(()  => throttle(updateStyles(list), 100));

  observer.observe(messagesBody, config);
  updateStyles(list);

  return observer;
}

let USER_LIST = [];
const init = () => {
  const matchURL = "app.slack.com";

  const location = window.location;
  const hostname = location.hostname;
  const chatId = location.pathname.split('/')[2];
  let activationListener;
  let observer;


  if (hostname === matchURL && chatId) {
    storageUpdate(chatId, (list, saveToStorage) => {
      USER_LIST =  list;

      if (observer) {
        observer.disconnect();
        observer = null;
      }
      observer = watchDOMChanges(list);
      if (!activationListener) {
        activationListener = window.addEventListener("keydown",
          (e) => onKeyCombination(e, saveToStorage));
      }
    });
  }
}

window.addEventListener('load', () => init(), false);
