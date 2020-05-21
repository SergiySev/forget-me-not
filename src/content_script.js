class ContentScript {
  constructor() {
    let location = window.location;
    this.matchURL = 'app.slack.com';
    this.KEY = 'l';
    this.activationListenerActivated = false;
    this.hostname = location.hostname;
    this.chatId = location.pathname.split('/')[2];
    this.usersList = [];
    this.messagesHolder = document.querySelector('body');
    this.MARK_MODE = false;
    this.clickFn = this.singeClick.bind(this);

    this.clickOptions = {
      once: true,
      passive: false,
      capture: true
    };

    this.mutationConfig = {
      attributes: false,
      characterData: false,
      childList: true
    };

    this.addObserver();
  }

  addObserver() {
    if (this.hostname === this.matchURL && this.chatId) {
      this.storageUpdate(() => {

        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        this.observer = this.watchDOMChanges();
        if (!this.activationListenerActivated) {
          this.activationListenerActivated = true;
          window.addEventListener("keydown",
            (e) => this.onKeyCombination(e));
        }
      });
    }
  }

  onKeyCombination(e) {
    if (e.ctrlKey && e.shiftKey && e.metaKey && e.key.toLowerCase() === this.KEY) {
      this.messagesHolder.removeEventListener('click', this.clickFn, this.clickOptions);

      if (!this.MARK_MODE) {
        this.messagesHolder.setAttribute('style', 'border: 6px dashed red');
        this.messagesHolder.addEventListener('click', this.clickFn, this.clickOptions);
        this.MARK_MODE = true;
      } else {
        this.messagesHolder.setAttribute('style', '');
        this.MARK_MODE = false;
      }
    }
  }

  singeClick(event) {
    const messageSelector = 'a.c-message__sender_link';
    this.messagesHolder.setAttribute('style', '');

    if (!event.target.matches(messageSelector)) {
      return;
    }
    event.stopImmediatePropagation();
    event.preventDefault();

    const target = event.target;
    if (target.dataset && target.dataset.messageSender) {
      const userId = target.dataset.messageSender;
      const user = target.innerText;

      if (userId) {
        this.saveToStorage({id: userId, name: user});
      }
    }
    this.MARK_MODE = false;
  }

  watchDOMChanges() {
    const messagesBody = document.querySelectorAll('body')[0];
    const updateStyles = () => this.usersList.forEach(user => this.markUser(user, false));
    const observer = new MutationObserver(()  => this.throttle(updateStyles(this.usersList), 100));

    observer.observe(messagesBody, this.mutationConfig);
    updateStyles(this.usersList);

    return observer;
  }

  storageUpdate(cb) {
    chrome.storage.onChanged.addListener((changes) => {
      const storageChange = changes[this.chatId];
      if (storageChange) {
        let deletedUsers = this.deletedUsedDetection(storageChange.oldValue, storageChange.newValue, 'id');
        this.cleanUpDeletedUser(deletedUsers);
        this.usersList = storageChange.newValue;
        cb(this.usersList);
      }
    });

    chrome.storage.sync.get([this.chatId], (result) => {
      this.usersList = result[this.chatId] || [];
      cb(this.usersList);
    });
  }

  saveToStorage(newUser) {
    if ( !this.usersList.some(u => u.id === newUser.id) ) {
      this.usersList.unshift({color: '#FF0000', ignore: false, ...newUser});
      chrome.storage.sync.set({ [this.chatId]: this.usersList });
    }
  }

  cleanUpDeletedUser(deletedUsers) {
    deletedUsers.forEach(user => this.markUser(user, true));
  }

  markUser(user, clearStyles) {
    let elements = Array.from(document.querySelectorAll(`[data-message-sender="${user.id}"]`));

    if (elements) {
      elements.forEach( (userNameContainer) => {
        const message = this.getMainParent(userNameContainer);

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

  // Helpers

  deletedUsedDetection(oldValues, newValues, key) {
    if (!oldValues || !newValues) return [];
    return oldValues.filter(firstArrayItem =>
      !newValues.some(
        secondArrayItem => firstArrayItem[key] === secondArrayItem[key]
      )
    );
  }

  getMainParent(elem) {
    return elem
      .parentElement.parentElement.parentElement
      .parentElement.parentElement.parentElement;
  }

  throttle(callback, limit) {
    let wait = false;
    return function () {
      if (!wait) {
        callback.call();
        wait = true;
        setTimeout(() => {wait = false}, limit);
      }
    }
  }
}

window.addEventListener('load', () => new ContentScript(), false);
