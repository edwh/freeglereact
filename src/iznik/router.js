require('iznik/events');
require('iznik/models/session');
require('iznik/views/modal');
require('iznik/views/help');
require('iznik/views/signinup');

Iznik.Session = new Iznik.Models.Session();

Iznik.Session.askedPush = false;

Iznik.Router = Backbone.Router.extend({
    routes: {
        '*': 'userHome'
    },

    initialize: function () {
        var self = this;

        // We want the ability to abort all outstanding requests, for example when we switch to a new route.
        self.xhrPool = [];
        self.abortAll = function() {
            _.each(self.xhrPool, function(jqXHR) {
                try {
                    jqXHR.abort();
                } catch (e) {}
            });

            self.xhrPool = [];
        };

        $.ajaxSetup({
            beforeSend: function(jqXHR) {
                self.xhrPool.push(jqXHR);
            },
            complete: function(jqXHR) {
                var index = $.inArray(jqXHR, self.xhrPool);
                if (index > -1) {
                    self.xhrPool.splice(index, 1);
                }
            }
        });

        // Any pages with trailing slashes should route the same as ones without.
        this.route(/(.*)\/+$/, "trailFix", function (id) {
            this.navigate(id, true);
        });

        this.bind('route', this.pageView);
    },

    pageView: function () {
        // TODO
        // var url = Backbone.history.getFragment();
        //
        // if (!/^\//.test(url) && url != "") {
        //     url = "/" + url;
        // }
        //
        // // Make sure we have google analytics for Backbone routes.
        // require(["ga"], function(ga) {
        //     try {
        //         // TODO Make configurable
        //         ga('create', 'UA-10627716-2');
        //         ga('send', 'event', 'pageView', url);
        //         var timestamp = (new Date()).getTime();
        //         monitor.trackEvent('route', url, null, null, null, timestamp);
        //     } catch (e) {
        //         console.log("Google exception - privacy blocker?", e);
        //     }
        // });
    },

    loadRoute: function (routeOptions) {
        var self = this;

        // We're no longer interested in any outstanding requests, and we also want to avoid them clogging up
        // our per-host limit.
        self.abortAll();

        // Tidy any modal grey.
        $('.modal-backdrop').remove();

        // The top button might be showing.
        $('.js-scrolltop').addClass('hidden');

        //console.log("loadRoute"); console.log(routeOptions);
        routeOptions = routeOptions || {};

        self.modtools = routeOptions.modtools;
        Iznik.Session.set('modtools', self.modtools);

        function loadPage() {
            // TODO
            // firstbeep = true;

            // Hide the page loader, which might still be there.
            $('#pageloader').remove();
            $('body').css('height', '');

            routeOptions.page.render();
        }

        loadPage();
    },

    userHome: function () {
        var self = this;

        if (document.URL.indexOf('modtools') !== -1) {
            Router.navigate('/modtools', true);
        } else {
            self.listenToOnce(Iznik.Session, 'isLoggedIn', function (loggedIn) {
                // console.log("Logged in", loggedIn);
                if (loggedIn || _.isUndefined(loggedIn)) {
                    require(["iznik/views/pages/user/home"], function() {
                        var page = new Iznik.Views.User.Pages.Home();
                        self.loadRoute({page: page});
                    });
                } else {
                    require(["iznik/views/pages/user/landing"], function() {
                        console.log("Load landing");
                        var page = new Iznik.Views.User.Pages.Landing();
                        self.loadRoute({page: page});
                    });
                }
            });

            Iznik.Session.testLoggedIn();
        }
    },
});