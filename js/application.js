'use strict';

var app = angular.module("twooter", ["ngSanitize"]);

// Configure the application:
app
  .config(function($routeProvider) {
    $routeProvider
      .when("/", { controller: "TwootListController", templateUrl: "/views/twootList.html"})
      .when("/twoot/:id", { controller: "TwootController", templateUrl: "/views/twootView.html"})
    ;
  })
;

// Services:
// ----------------------

// Message broadcast service:
app.factory("MessageService", function($rootScope) {
  $rootScope.activeMessages = [];

  // Display a message for a few seconds:
  return {
    display: function(message) {
      var msgId = ($rootScope.activeMessages.push(message)) - 1;

      // Remove the message after a while:
      setTimeout(function() {
        $rootScope.$apply(function() {
          if($rootScope.activeMessages.length == 1) {
            $rootScope.activeMessages = [];
          } else {
            $rootScope.activeMessages.splice(msgId, msgId);
          }
        });
      }, 3000);
    }
  };
});

// Twoots factory:
app.factory("Twoots", function(MessageService) {
  var twoots = [
    { id: 5, author: { name: "Bob Dole" }, content: "This is a twoot!" },
    { id: 4, author: { name: "John Doe" }, content: "Something clever #tag",
      replyTo: 1},
    { id: 3, author: { name: "Carl Sagan" }, content: "This is a #cooltag",
      replyTo: 1},
    { id: 2, author: { name: "Cool Bro" }, content: "Here's a http://www.google.com/link" },
    { id: 1, author: { name: "Ted Dundley" }, content: "Hellloooooo! #tag",
      replies: [4, 3]}
  ];

  function getTwootById(id) {
    for(var i = 0; i < twoots.length; i++) {
      var foundTwoot = twoots[i];

      if(foundTwoot.id == id) { return foundTwoot; }
    }
  };

  function insertTwoot(twoot) {
    if(twoot.content == "") {
      MessageService.display({
        text: "Twoots cannot be empty! :(",
        type: "error"
      });

      return false;
    }

    // Get the new ID for this twoot:
    twoot.id = twoots.length + 1
    twoots.unshift(twoot)

    if(twoot.replyTo) {
      var repliedTwoot = getTwootById(twoot.replyTo);
      repliedTwoot.replies = repliedTwoot.replies || [];
      repliedTwoot.replies.push(twoot.id);
    }

    MessageService.display({ text: "New twoot saved!", type: "success" });
  };

  return {
    all: function() { return twoots; },
    insert: insertTwoot,
    get: getTwootById
  };
});


// Filters:
// ---------------------------
app.filter("tags", function() {
  var TAG_REGEX = /\#[\w\d_\-]+/;

  var tagFilter = function(input) {
    var match;

    while((match = input.match(TAG_REGEX))) {
      var tag = match[0];

      // Replace the tag with a link
      // to filter tags or something:
      input = input.replace(tag,
        "<span class=\"tag\">" + tag + "</span>"
      );

      return input;
    }

    return input;
  };

  return tagFilter;
});

// Controllers:
// ---------------------------

// Main controller:
app.controller("ApplicationController", function($scope) {});


// Twoot list controller:
app.controller("TwootListController", function($scope, Twoots) {
  $scope.twoots = Twoots.all();
});

// Twoot view controller:
app.controller("TwootController", function($scope, $routeParams, Twoots) {
  $scope.twoot = Twoots.get($routeParams.id);
  $scope.replies = [];

  angular.forEach($scope.twoot.replies, function(replyId) {
    $scope.replies.push(Twoots.get(replyId));
  });
});

// Reply to Twoot form:
app.controller("ReplyToTwootController", function($scope, $routeParams, Twoots) {
  $scope.twoot = Twoots.get($routeParams.id);
  $scope.replyTo = $scope.twoot.id;
});

// New twoot form:
app.controller("NewTwootController", function($scope, $location, Twoots) {
  $scope.maxLength = 140;
  $scope.newTwoot = {
    content: ""
  };

  // Save a twoot:
  $scope.submitTwoot = function() {
    var newTwoot = {
      author: { name: "You" },
      content: $scope.newTwoot.content
    };

    if($scope.replyTo) {
      newTwoot.replyTo = $scope.replyTo;
    }

    Twoots.insert(newTwoot);
    $scope.newTwoot.content = "";
    $location.path("");
  };
});