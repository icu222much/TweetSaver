(function() {

  'use strict';

  const TWITTER_ENDPOINT = 'http://tweetsaver.herokuapp.com';
  const TWITTER_ERROR_MESSAGE = 'Twitter query failed. Please try another query.';
  const TWITTER_MAX_TWEETS = '10';
  const LOCAL_STORAGE_TWEETS = 'storedTweets';

  $(document).ready(() => {
    $('.list').on('mousedown', '.tweet .tweet__close', onCloseTweet);
    $('.search__button').on('mousedown', onSearchTweet);
    $('.search__input').on('keydown', onSubmitTweetSearch);

    setupDragAndDrop();
    preventHorizontalScroll();
    loadSavedTweets();
    setupObserver();
  });

  function setupDragAndDrop() {
    $('.list__results, .list__saved').sortable({
      connectWith: '.list'
    }).disableSelection();
  }

  function preventHorizontalScroll() { /* if .tweet is dragged off the viewport */
    let $document = $(document);
    $document.bind('scroll', function() {
      if ($document.scrollLeft() !== 0) {
          $document.scrollLeft(0);
      }
    });
  }

  function loadSavedTweets() {
    let storage = getStorageItem(LOCAL_STORAGE_TWEETS) || {};
    for (let key in storage) {
      if (key !== 'undefined') {
        let payload = Object.assign({id: key}, storage[key]);
        $('.list__saved').append(createTweetDom(payload));
      }
    }
  }

  function setupObserver() {
    let observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        let $listSaved = $('.list__saved');
        
        // add/remove Tweets from local storage
        if (mutation.addedNodes.length > 0 && !$(mutation.addedNodes[0]).hasClass('ui-sortable-placeholder')) {
          addTweetToStorage(mutation.addedNodes[0]);
        } else if (mutation.removedNodes.length > 0 && !$(mutation.removedNodes[0]).hasClass('ui-sortable-placeholder')) {
          removeTweetFromStorage(mutation.removedNodes[0]);
        }
      });
    });
    let observerConfig = {
      childList: true
    };
    let target = document.getElementsByClassName('list__saved')[0];
    observer.observe(target, observerConfig);
  }

  function addTweetToStorage(element) {
    let $element = $(element);
    let id = $element.attr('data-id');
    let storage = getStorageItem(LOCAL_STORAGE_TWEETS) || {};

    storage[id] = {
      avatar: $element.find('.tweet__avatar').attr('src'),
      name: $element.find('.tweet__name').text(),
      handle: $element.find('.tweet__handle').text(),
      date: $element.find('.tweet__date').text(),
      message: $element.find('.tweet__message').text()
    };

    setStorageItem(LOCAL_STORAGE_TWEETS, storage);
  }

  function removeTweetFromStorage(element) {
    let id = $(element).attr('data-id'); 
    
    if (id) {
      let storage = getStorageItem(LOCAL_STORAGE_TWEETS);
      delete storage[id];
      setStorageItem(LOCAL_STORAGE_TWEETS, storage);
    }
  }

  function getStorageItem(name) {
    return JSON.parse(localStorage.getItem(name));
  }

  function setStorageItem(name, payload) {
    localStorage.setItem(name, JSON.stringify(payload));
  }

  function onCloseTweet(e) {
    $(e.target).parents('.tweet').remove();
  }

  function onSubmitTweetSearch(e) {
    if (e.which === 13) {
      onSearchTweet();
    }
  }

  function onSearchTweet() {
    let query = escapeHtml($('.search__input').val());

    $('.list__results').html(''); // clear tweets

    $.ajax({
      url: TWITTER_ENDPOINT,
      data: {
        q: query,
        count: TWITTER_MAX_TWEETS
      },
      dataType: 'jsonp',
      error: searchTweetFailed,
      success: searchTweetSuccess
    });
  }

  function searchTweetFailed() {
    $('.list__results').html(TWITTER_ERROR_MESSAGE);
  }

  function searchTweetSuccess(response) {
    if (response.tweets.length) {
      response.tweets.forEach((tweet) => {
        let data = {
          id: tweet.id,
          avatar: tweet.user.biggerProfileImageURL,
          name: tweet.user.name,
          handle: tweet.user.screenName,
          date: unixToDate(tweet.createdAt),
          message: tweet.text
        };
        $('.list__results').append(createTweetDom(data));
      });
    } else {
      searchTweetFailed();
    }
  }

  function createTweetDom({id, avatar, name, handle, date, message}) {
    return (
      `<div class="tweet" data-id="${id || Math.random()}">` +
        `<div class="tweet__close">X</div>` +
        `<img class="tweet__avatar" src="${avatar || ''}" />` +
        `<div class="tweet__content">` +
          `<div class="tweet__meta">` +
            `<span class="tweet__name">${name || ''}</span>` +
            `<span class="tweet__handle">` +
              `<a class="tweet__handle-link" href="http://www.twitter.com/${handle || ''}" target="_blank">` +
                `${handle || ''}` +
              `</a>` +
            `</span>` +
            `<span class="tweet__date">${date || ''}</span>` +
          `</div>` +
          `<p class="tweet__message">${linkify(message) || ''}</p>` +
        `</div>` +
      `</div>`
    );
  }

  // Modified from: https://stackoverflow.com/a/3890175/1054937
  function linkify(inputText) {
    let replacedText, patternHttp, patternWww, patternAt;

    //URLs starting with http://, https://
    patternHttp = /(\b(https):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(patternHttp, '<a class="tweet__message-link" href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    patternWww = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(patternWww, '$1<a class="tweet__message-link" href="http://$2" target="_blank">$2</a>');

    //Change Twitter handles (@) to links
    patternAt = /(^|[^@\w])@(\w{1,15})\b/gim; // from: https://stackoverflow.com/a/13398311/1054937
    replacedText = replacedText.replace(patternAt, '<a class="tweet__message-link" href="http://www.twitter.com/$2" target="_blank"> @$2</a>');

    return replacedText;
}

  function unixToDate(timestamp) {
    let date = new Date(timestamp);
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let year = date.getFullYear();
    let month = months[date.getMonth()];
    let day = date.getDate();
    let time = month + ' ' + day + ', ' + year;
    return time;
  }

  function encodeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function escapeHtml(str) {
    let div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
}());