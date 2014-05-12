/* jshint esnext: true */
angular.module('glue')

.factory('aceHelper', (modelist) => {
    return {
        detect: (code) => {
            console.error('aceHelper.detect(code) is NYI (it always returns javascript for now)');
            return 'javascript';
            // return hljs.highlightAuto(code).language;
            // console.log('autodetect', hljs.highlightAuto(code));
            // $http.post('/snippets/?detect=1', { code: code }).then((result) => {
            //     var mode = result.data[0];
            //     console.log(mode);
            //     var modeObj = modelist.getModeForPath(mode);
            //     $rootScope.aceConfig.mode = modeObj.name;
            // });
        }
    };
});