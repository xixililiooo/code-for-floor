
class Element{
    /**
     *  //创建一个虚拟节点
     * @param {*} type   //元素的类型
     * @param {*} props  //属性
     * @param {*} children  //孩子节点
     * @param {*} text  文本节点的文本值
     */
    constructor(type,props,children,text){
        this.type = type;
        this.props = props;
        this.children = children;
        this.text = text;
    }
}
/**
 * 
 * @param {*} type 元素的类型
 * @param {*} props  元素的属性
 * @param {*} children 元素的孩子节点
 */
 function createElement(type,props,children){
    children = children.map(child=>{
        if(typeof child == 'string'){  //如果是字符串就转换成文本的虚拟dom
            return new Element(undefined,undefined,undefined,child);
        }else{ 
            return child;
        }
    })
    return new Element(type,props,children)
}
function setAttrs(node,key,value){  //根据虚拟props属性设置真实dom的属性
    switch(key){
        case 'value':
            if(node.tagName.toUpperCase()==='INPUT'||node.tagName.toUpperCase()==='TEXTAREA'){
                node.value = value;
            }else{
                node.setAttribute(key,value);
            }
            break;
        case 'style':
            for(let style_key in value){
                node.style[style_key] = value[style_key];
            }
            // console.log('value',value);
            // node.style = value;
            break;
        default :
            node.setAttribute(key,value);
            break;
    }
}
function createDomElement(element){  //把虚拟dom转换成真实dom
    let {type , props , children , text} = element;
    let el;
    if(type){
        el = document.createElement(type);
        for(let key in props){
            setAttrs(el,key,props[key]);
        }
        children.forEach(child=>{
            render(child,el);
        })
    }else{
        el = document.createTextNode(text);  //如果是文本的虚拟dom，就转换成文本节点
    }
    return el;
}
function render(element,container){
    let domelement = createDomElement(element);  //把虚拟节点转化成真实的dom
    container.appendChild(domelement);  //把真实的dom挂在到container下
    return domelement;
}
export {
    createElement, //创建虚拟dom
    render,  //把真实dom挂载页面
    createDomElement, //将虚拟dom转换成真实dom
    setAttrs  //根据虚拟dom的Props设置真实dom的属性
}