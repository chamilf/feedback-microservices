// QP-3458 : Since the old ifdef style directives are broken/removed from IE10+, use the script below
// to determine browser version and do browser-specific stuff such as including scripts by adding
// them to the <head> using jquery. Applies to (MSIE 7.0|8.0|9.0|10.0 or IE 11.0)

navigator.sayswho = (function () {
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
    return M.join(' ');
})();