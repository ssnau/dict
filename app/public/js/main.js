var app = angular.module('DictApp', []);

/* route */
app.config(function($routeProvider) {
    $routeProvider.when("/:word", {
        controller: "Detail",
        template:"<div collins=\'{{word}}\' collins class=\'detail\'>\n    <div class=\'title row\'>\n        <h3>{{word}}</h3>\n        <a read=\'{{word}}\' href=\"#\">read</a>\n    </div>\n</div>"
    })
});
/* controllers*/
app.controller("Dict", function($scope, $routeParams){
    $scope.wordlist = wordList;
});

app.controller("Detail", function($scope, $routeParams){
    var word = $routeParams.word;
    $scope.word = word;
});

/* filters */
/**
 * @param input [Array]
 * @search input [String] will be convert to RegExp
 * @return [Array]
 */
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

/* directives */

/**
 * wildcard require two parameters, wildcard="A:B“
 * A stands for the input while B is the output
 * NOTICE: output is string to be used with new RegExp(output), the reason I leave
 * it to be RAW String is that once I make it into RegExp I don't
 * know how to safely make it Case Insensitive in the succeed function.
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
               if (/[^a-zA-Z0-9.*$]/.test(w)) {
                   w = "";
                   //TODO: we need to emit event, not handle css class here
                   element.addClass("error");
               } else {
                   element.removeClass("error");
               }
               scope[target] = w && "^" + w.replace(/\./, "\\.").replace(/\*/g, ".*");
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

/**
 * used to make a list selectable, need to used on <a> and set its :focus style
 * usage: <a selectlist="namespace" />
 */
(function(){
    var lookup = {},
        rev_lookup = {};

    app.directive("selectlist", function(){
        return {
            compile: function(element, attrs) {
                var ns = attrs["selectlist"];
                if (!lookup[ns]) lookup[ns] = {};
                if (!rev_lookup[ns]) rev_lookup[ns] = {};

                return function(scope, element) {
                    scope.$watch("$index", function(){
                        var ns = element.attr("selectlist");
                        if (!element.attr('id')) {
                            element.attr('id', _.uniqueId('selectlist_item_'))
                        }
                        var sIndex = scope.$index + '';
                        // to prevent memory leak, we need to delete
                        var pre = lookup[ns][sIndex];
                        if (pre) {
                            var preId = pre.attr('id');
                            var obj = rev_lookup[ns];
                            if (rev_lookup[ns][preId] == sIndex)
                                delete obj[pre.attr('id')];
                        }
                        lookup[ns][sIndex] = element;
                        rev_lookup[ns][element.attr('id')] = sIndex;
                    });
                }
            }
        };
    });

    //register key binding event
    key("down", function(e){
        var element = angular.element(e.target),
            ns = element.attr("selectlist");

        if (!ns) return;

        var nextElement = getSibling(element, true);
        nextElement && nextElement.focus();
        // we need element.scope() to get the exact scope
        // if we use a scope that its corresponding element
        // is not in the dom tree, it do not have a parent scope
        // that make the $emit useless.
        !nextElement && element.scope().$emit("SelectListOutOfBottomBound", {"ns": ns})
        e.preventDefault();
    });
    key('up', function(e){
        var element = angular.element(e.target),
            ns = element.attr("selectlist");

        if (!ns) return;

        var prevElement = getSibling(element, false);
        prevElement && prevElement.focus();
        !prevElement && element.scope().$emit("SelectListOutOfUpperBound", {"ns": ns});
        e.preventDefault();
    });


    /**
     * helper function to get the next/prev sibling
     * @param elem {JQueryElement} the source element
     * @param next {Boolean} TRUE to get the next sibling, FALSE to get the previous
     * @return {JQueryElement|Boolean}
     */
    function getSibling(elem, next) {
        var s = elem.attr("selectlist");
        var offset = next ? 1 : -1;
        if (s) {
        /*
            var index = elem.getAttribute('sl-inx') - 0;
            var sbElement = $("a["+"selectlist="+s+"]").filter("[sl-inx="+(index+offset)+"]");
            return (sbElement.length && sbElement.css('display') != "none") ? sbElement : false;
            */
            var index = rev_lookup[s][elem.attr('id')] - 0;
            //make sure we are looking for a string key not a number
            var sbElement = lookup[s][(index + offset )+''];
            return sbElement && sbElement.css('display') != "none" ? sbElement : false;
        }
        return false;
    }

})();

app.directive("selectlistSource", function(){
    return {
        link: function(scope, element){
            var s = element.attr('selectlist-source');
            s = eval("({" + s + "})"); //use eval because JSON.parse may not accept '
            _.each(s, function(v,k) {
                if (k == "ns") return true; //ignore this one
                scope.$on(k, function(e, params) {
                    if (params.ns == s.ns) eval(v);
                });
            });
        }
    }
})


/* bind keys */
key.filter =  function(event){
    var tagName = (event.target || event.srcElement).tagName;
    //comment the INPUT, we need to do something when the target is INPUT
    return !(/*tagName == 'INPUT' || */tagName == 'SELECT' || tagName == 'TEXTAREA');
}

key('esc', function(){
   $("#mainSearchBox").focus();;
});

key('down', function(e){
   if (e.target.id == "mainSearchBox")   {
       $(".wordlist li a").first().focus();
   }
});

key('enter', function(e){
    if (e.target.tagName.toLowerCase() !== "a") {
        $('a[read]').click(); //TODO: refactor this not do dependent on a[read]
    }
});
key('ctrl + r', function(){
    $('a[read]').click(); //TODO: refactor this not do dependent on a[read]
});

/* dom specific */
$("#mainSearchBox").focus(function(){
    $(this).select();
});
