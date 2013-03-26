
var app = angular.module('DictApp', []);

app.config(function($routeProvider) {
    $routeProvider.when("/:word", {
        controller: "Detail",
        template:"<div collins=\'{{word}}\' collins class=\'detail\'>\n    <div class=\'title row\'>\n        <h3>{{word}}</h3>\n        <a read=\'{{word}}\' href=\"#\">read</a>\n    </div>\n</div>"
    })
});

app.controller("Dict", function($scope, $routeParams){
    $scope.wordlist = wordList;
});

app.controller("Detail", function($scope, $routeParams){
    var word = $routeParams.word;
    $scope.word = word;
});

app.filter('regexp', function(){
    return function(input, search){
        if (!_.string.trim(search)) return false;
        var reg = new RegExp(search, "i"); //case insensitive
        var result = [];
        _.each(input, function(v){
            if (reg.test(v)) result.push(v);
        })
        return result;
    };
});

/**
 * wildcard require two parameters, wildcard="A:B“
 * A stands for the input while B is the output
 */
app.directive("wildcard", function(){
   return {
       link: function(scope, element, attrs) {
           var wc = attrs.wildcard.split(":"),
               watched = wc[0],
               target = wc[1];

           if (!watched || !target) return;

           scope.$watch(watched, function(){
               var w = (scope.word && _.string.trim(scope.word)) || "";
               if (/[^a-zA-Z0-9 *]/.test(w)) {
                   w = "";
                   //TODO: we need to emit event, not handle css class here
                   element.addClass("error");
               } else {
                   element.removeClass("error");
               }
               scope[target] = w && "^" + w.replace(/\*/g, ".*");
           })
       }
   }
});



app.directive("collins", function($http){
    return {
        link: function(scope, element){
            $http.get('/lookup/collins/' + scope.word).success(function(res){
                element.append(res);

                /* hide the extra dictionary, we do not need it*/
                var tabs = element.find(".tab_content.tab_authorities");
                if (tabs.length == 2)  tabs[1].style.display = 'none';

                /* replace any link into valid one*/
                /*<a class="explain" href="/mackintosh">mackintosh</a> ==> href="#/mackintosh"*/
                /*reception centre => reception_centre*/
                var explain = element.find("a.explain");
                _.each(explain, function(el) {
                    var href = el.getAttribute("href");
                    el.setAttribute("href", href && href.replace(/\/(\w+)/, "#/$1").replace(/_/g, " "));
                });

            });
        }
    }
})

app.directive("read", function(){
    return {
        link: function(scope, element) {
            /* play the audio */
            element.on('click', function(e){
                e.preventDefault();
                var url ="/voice/" + element.attr('read');
                var sound =  new Audio();
                sound.src = url;
                sound.play();
            });
            // watch for nothing just waiting for the
            // element.attr('read') is no longer the MACRO literal
            scope.$watch("read", function(){
                // test whether the URL is valid
                var url = "/voice/" + element.attr("read");
                var sound = new Audio();
                sound.onerror = function(e){
                    element.css("display", "none");
                };
                sound.src = url;
            })
        }
    }
});

/**
 * used with ng-repeat, always hash with the first item.
 * NEED to write down the hash as live="#/xxxx"
 */
(function(){
    var timeHandler = null;
    app.directive("live", function($timeout){
        return {
            link: function(scope, element) {
                /* watch for $index alway request the first one*/
                scope.$watch("$index", function(){
                    if (scope.$index == 0) { //if it is the first one
                        // clear the timeout first
                        timeHandler && $timeout.cancel(timeHandler);
                        timeHandler = $timeout(function(){
                            window.location.hash = element.attr("live");
                        }, 300);
                    }
                })
            }
        }
    });
})();


/* bind keys */
key.filter =  function(event){
    var tagName = (event.target || event.srcElement).tagName;
    //comment the INPUT, we need to do something when the target is INPUT
    return !(/*tagName == 'INPUT' || */tagName == 'SELECT' || tagName == 'TEXTAREA');
}
key('esc', function(){
   $(".searchbar input").val("").focus();;
});

key('enter', function(e){
    if (e.target.tagName.toLowerCase() !== "a") {
        $('a[read]').click(); //TODO: refactor this not do dependent on a[read]
    }
});