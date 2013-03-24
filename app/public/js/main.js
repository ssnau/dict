
var app = angular.module('DictApp', []);

app.config(function($routeProvider) {
    $routeProvider.when("/:word", {
        controller: "Detail",
        template:"<div dictword=\'{{word}}\' class=\'detail\'>\n    <div class=\'title row\'>\n        <h3>{{word}}</h3>\n        <a read=\'{{word}}\' href=\"#\">read</a>\n    </div>\n</div>"
    })
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

app.controller("Dict", function($scope, $routeParams){
    $scope.wordlist = wordList;
})

app.controller("Detail", function($scope, $routeParams){
    var word = $routeParams.word;
    $scope.word = word;
})

app.directive("dictword", function($http){
    return {
        link: function(scope, element){
            $http.get('/lookup/collins/' + scope.word).success(function(res){
                element.append(res);

                /* hide the extra dictionary, we do not need it*/
                var tabs = element.find(".tab_content.tab_authorities");
                if (tabs.length == 2)  tabs[1].style.display = 'none';

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
            })
        }
    }
})


