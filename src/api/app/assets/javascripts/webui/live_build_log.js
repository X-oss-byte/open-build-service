var LiveLog = function(wrapperId, startButton, stopButton, status, finished, info, faviconFinished, faviconRunning, faviconPaused, faviconSucceeded, faviconFailed) {
  this.wrapper = $(wrapperId);
  this.startButton = $(startButton);
  this.stopButton = $(stopButton);
  this.notificationsButton = $('.link_notifications');
  this.status = $(status);
  this.faviconFinished = faviconFinished;
  this.faviconRunning = faviconRunning;
  this.faviconPaused = faviconPaused;
  this.faviconSucceeded = faviconSucceeded;
  this.faviconFailed = faviconFailed;
  this.initial = true;
  this.lastScroll = 0;
  this.ajaxRequest = 0;
  this.offset = 0;
  this.finished = finished;
  this.logInfo = $(info);
};

$.extend(LiveLog.prototype, {
  initialize: function() {
    this.startButton.click($.proxy(this.start, this));
    this.stopButton.click($.proxy(this.stop, this));
    if (Notification.permission === 'default') { // jshint ignore:line
      this.notificationsButton.click($.proxy(this.askNotificationPermission, this));
    }
    else {
      this.notificationsButton.html(this.notificationsButton.html().replace('Request Browser Notifications', 'Browser Notifications ' + Notification.permission)); // jshint ignore:line
      this.notificationsButton.addClass('disabled');
    }
    this.start();
    this.initial = false;
    return this;
  },

  start: function() {
    if (!this.finished) {
      this.autoRefresh = true;
      this.lastScroll = 0;
      this.loadContent();
      this.indicatorStatus('running');
      this.faviconStatus(this.faviconRunning);
      this.startButton.addClass('d-none');
      this.stopButton.removeClass('d-none');
    }
    return false;
  },

  stop: function() {
    this.autoRefresh = false;
    this.indicatorStatus('paused');
    this.faviconStatus(this.faviconPaused);
    this.stopAjaxRequest();
    this.stopButton.addClass('d-none');
    this.startButton.removeClass('d-none');
    return false;
  },

  loadContent: function() {
    if (this.autoRefresh) {
      var url = this.wrapper.data('url') + '&offset=' + this.offset + ';&' + 'initial=' + (this.initial ? '1' : '0');

      this.ajaxRequest = $.ajax({
        type: 'GET',
        url: url,
        data: null,
        error: $.proxy(this.stop, this),
        cache: false
      });
    }
  },

  autoScroll: function() {
    // just return in case the user scrolled up
    if (this.lastScroll > window.pageYOffset) { return; }
    // stop loadContent if the user scrolled down
    if (this.lastScroll < window.pageYOffset && this.lastScroll) { this.stop(); return; }
    var targetOffset = $('#footer').offset().top - window.innerHeight;
    window.scrollTo(0, targetOffset);
    this.lastScroll = window.pageYOffset;
  },

  buildStatusDetails: function(status) {
    switch (status) {
      case 'failed':
        return {content: 'Build failed', indicator: 'failed', favicon: this.faviconFailed};
      case 'succeeded':
        return {content: 'Build succeeded', indicator: 'succeeded', favicon: this.faviconSucceeded};
      default:
        return {content: 'Build finished', indicator: 'finished', favicon: this.faviconFinished};
    }
  },

  finish: function(status) {
    this.finished = true;
    this.stop();
    var statusDetails = this.buildStatusDetails(status);
    this.status.html(statusDetails.content);
    this.indicatorStatus(statusDetails.indicator);
    this.faviconStatus(statusDetails.favicon);
    this.hideAbort();
    this.stopButton.addClass('d-none');
    this.startButton.addClass('d-none');
  },

  stopAjaxRequest: function() {
    if (this.ajaxRequest !== 0)
      this.ajaxRequest.abort();
    this.ajaxRequest = 0;
  },

  showAbort: function() {
    $(".link_abort_build").removeClass('d-none');
    $(".link_trigger_rebuild").addClass('d-none');
  },

  hideAbort: function() {
    $(".link_abort_build").addClass('d-none');
    $(".link_trigger_rebuild").removeClass('d-none');
  },

  indicatorStatus: function(status) {
    this.logInfo.children().hide();
    this.logInfo.children('.' + status).show();
  },

  faviconStatus: function(source) {
    if (typeof source !== 'undefined')
      $("link[rel='shortcut icon']").attr("href", source);
  },

  browserNotification: function(status) {
    if (this.notificationSupport() && Notification.permission === "granted") { // jshint ignore:line
      var statusDetails = this.buildStatusDetails(status);
      new Notification('OBS: ' + statusDetails.content, // jshint ignore:line
        { body: 'The status of your Open Build Service build is "' + statusDetails.indicator + '".', icon: statusDetails.favicon }
      );
    }
  },

  askNotificationPermission: function () {
    if (this.notificationSupport() && Notification.permission === 'default') { // jshint ignore:line
      Notification.requestPermission().then(function (permission) { // jshint ignore:line
        if (permission === 'granted' || permission === 'denied') {
          liveLog.notificationsButton.html(liveLog.notificationsButton.html().replace('Request Browser Notifications', 'Browser Notifications ' + Notification.permission)); // jshint ignore:line
          liveLog.notificationsButton.addClass('disabled'); // jshint ignore:line
        }
      });
    }
  },

  notificationSupport: function () {
    if (!('Notification' in window)) {
      console.log("This browser does not support notifications."); // jshint ignore:line
      return false;
    } else {
      return true;
    }
  },
});
