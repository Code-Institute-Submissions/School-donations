var app = angular.module('Donations', []);

app.directive('donationsNav', function () {
    return {
        restrict: 'E',
        templateUrl:'/static/partials/donationsNav.html'
    };
});

app.directive('graphsDiv', function () {
    return {
        restrict: 'E',
        templateUrl:'/static/partials/graphsDiv.html'
    };
});
