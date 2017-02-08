/**
 * @author yu
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

var Y = require('../Y');
var Request = require('./Request');
var CoreRouter = require('../core/Router');
var InvalidCallException = require('../core/InvalidCallException');

class WebRestful extends CoreRouter {
    
    /**
     * listen request
     */
    static requestListener(request, response) {
        var pathname = Request.parseUrl(request).pathname;
        var httpMethod = request.method;
        var handlers = WebRestful.methods[httpMethod];
        var matchedHandler = null;
        var parsedRoute = null;
        var matches = null;
        
        for(let i=0,len=handlers.length; i<len; i++) {
            parsedRoute = WebRestful.parse(handlers[i]['pattern']);
            handlers[i]['paramKeys'] = parsedRoute.params;  // null or array
            handlers[i]['paramValues'] = null;
            
            matches = pathname.match( new RegExp(parsedRoute.pattern) );
            
            // 匹配到路由
            if(null !== matches) {
                matchedHandler = handlers[i];
                
                // 存储参数
                if(null !== matchedHandler.paramKeys) {
                    let requestInstance = new Request(request);
                    matchedHandler.paramValues = [];
                    
                    for(let j=0,l=matchedHandler.paramKeys.length; j<l; j++) {
                        requestInstance.setGetParam(matchedHandler.paramKeys[j],
                            matches[j+1]);
                            
                        matchedHandler.paramValues.push(matches[j+1]);
                    }
                }
                
                // 匹配到就退出
                break;
            }
        }
        
        if(null === matchedHandler) {
            throw new InvalidCallException('The route: ' + pathname + ' not found');
        }
        
        var args = null === matchedHandler.paramValues ? [null] : matchedHandler.paramValues;
        if('function' === typeof matchedHandler.handler) {
            matchedHandler.handler(request, response, ...args);
                
        } else {
            let pos = matchedHandler.handler.indexOf('@');
            let obj = null;
            let clazz = '';
            let clazzMethod = '';
            
            if(-1 === pos) {
                obj = Y.createObject(matchedHandler.handler);
                obj.index(request, response, ...args);
            
            } else {
                clazz = matchedHandler.handler.substring(0, pos);
                clazzMethod = matchedHandler.handler.substring(pos + 1);
                
                obj = Y.createObject(clazz);
                obj[ clazzMethod ](request, response, ...args);
            }
        }
    }
    
    /**
     * Adds a route to the collection
     *
     * @param String|Array httpMethod
     * @param String pattern
     * @param Function|String handler
     */
    static addRoute(httpMethod, pattern, handler) {
        if('string' === typeof httpMethod) {
            WebRestful.methods[httpMethod].push( {pattern: pattern, handler: handler} );
            return;
        }
        
        for(let i=0,len=httpMethod.length; i<len; i++) {
            WebRestful.methods[httpMethod[i]].push( {pattern: pattern, handler: handler} );
        }
    }
    
    /**
     * get
     */
    static get(pattern, handler) {
        WebRestful.addRoute('GET', pattern, handler);
    }
    
    /**
     * post
     */
    static post(pattern, handler) {
        WebRestful.addRoute('POST', pattern, handler);
    }
    
    /**
     * put
     */
    static put(pattern, handler) {
        WebRestful.addRoute('PUT', pattern, handler);
    }
    
    /**
     * delete
     */
    static delete(pattern, handler) {
        WebRestful.addRoute('DELETE', pattern, handler);
    }
    
    /**
     * patch
     */
    static patch(pattern, handler) {
        WebRestful.addRoute('PATCH', pattern, handler);
    }
    
    /**
     * head
     */
    static head(pattern, handler) {
        WebRestful.addRoute('HEAD', pattern, handler);
    }
    
    /**
     * options
     */
    static options(pattern, handler) {
        WebRestful.addRoute('OPTIONS', pattern, handler);
    }

}

/**
 * 请求方法
 *
 * each method has the follow structure
 *
 * [ {pattern: pattern, handler: handler} ... ]
 *
 */
WebRestful.methods = {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: [],
    PATCH: [],
    HEAD: [],
    OPTIONS: []
};

module.exports = WebRestful;
