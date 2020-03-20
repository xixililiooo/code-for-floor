

/*
    在之前的推文中，我们有写过关于dom-diff的推文，创建vnode的过程实际上是调用了createElement方法，在之前的推文我们并没有涉及到
    模板编辑，而是使用了一个对象
    整个compile过程分为三个过程，parse，optimize以及generate过程,接下来一步步来了解这三个过程
*/

//我们首先准备一个模板，一段很常见的代码，但是足够我们来分析这个过程了
// let template = `
//     <div :class="c" class="demo" v-if="isShow">
//         <span v-for="item in sz">{{item}}</span>
//     </div>
// `
// template = template.trim();
let template = '<div :class="c" class="demo" v-if="isShow"><span v-for="item in sz">{{item}}</span></div>';
//第一个过程是parse,通过正则表达式将template中的字符串进行解析，得到属性和指令等数据，形成AST(抽象语法树)。
//这个过程涉及到比较多的正则表达式，建议大家阅读这部分之前可以先查阅一下正则的基本使用
//通过parser得到的AST的样子为
/*
    {
        'tag':"div",
        "attrsMap":{
            ":class":"c",
            "class":"demo",
            "v-if":"isShow"
        },
        classBinding:"c",
        "if":"isShow",
        "ifConditions":[
            'exp':"isShow"
        ]
    }
*/

//首先我们定义几个我们需要使用到的正则
const ncname = '[a-zA-Z_][\\w\\-\\.]*';  //  在字符串里 \\w表示双重转义 相当于正则里的\w
const singleAttr = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/;
//上面这个表达式有点复杂，我们需要对其拆分来理解
/*
    1.首先是^\s*表示以任意个空格开头
    2.然后是([^\s"'<>/=]+)表示多个(一个以上)的非空格单引号双引号大于号小于号等于号左斜杠的符号，说白了就是属性名
    3.首先要明白(?:)是非捕获性分组，它不会把捕获得到的结果返回，但会把匹配得到的结果返回
        所以对于后面(?:\s*(=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?
        首先属性值可以有也可以没有，比如Boolean类型
        如果有属性值，属性值又可以使用单引号 双引号或者没有引号
        然后对于非捕获性分组，我们举个例子class="demo" 
        期望返回的并不是 ="demo" 这段,我们期望的是返回=和"demo"，所以捕获性分组应该设置在=和属性值上
        所以通过这段正则我们可以得到单个属性的key和value
*/
const qnameCaptrue = `((?:${ncname}\\:)?${ncname})`;  //用于获取属性名的正则，但是要兼顾aaa:aaa的情况
const startTagOpen = new RegExp(`^<${qnameCaptrue}`);  //匹配标签开始
const startTagClose = /^\s*(\/?)>/  //开始标签结束，考虑自闭合标签
const endTag = new RegExp(`^<\\/${qnameCaptrue}[^>]*>`); //匹配结束标签
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;  //匹配双括号引用的变量
const forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/;  //匹配循环表达式

//我们所需要的全部正则已经定义好，接下来可以进行我们的解析过程
//解析过程主要是把template字符串循环匹配，每次匹配到一段字符串就去除这段字符串，然后继续往下匹配

const stack = [];  //维护一个栈来保存已经解析号的标签头，这样我们可以根据在解析尾部标签的时候得到所属层次关系以及父标签
let currentParent, root; //同时定义一个currentParent变量用来存放当前标签的父标签节点，root变量用于存储根标签节点
let index = 0;
function advance(n) {
    index += n;
    template = template.substring(n);
}
//————-——————————————————————————————————————————————————————————————————————
//从这里开始为parser部分


function parseHTML() {
    //首先我们需要定义一个parseHTMLhanshu,在里面我们来循环解析template字符串
    //对标签头标签尾以及本文分别进行处理
    while (template) {
        let textEnd = template.indexOf('<');
        if (textEnd == 0) {  //第一个字符为<说明是标签(包括开始标签和结束标签)
            const endTagMatch = template.match(endTag);
            if (endTagMatch) {
                    advance(endTagMatch[0].length);
                    parseEndTag(endTagMatch[1]);  //把标签名作为参数，用parseEndTag来解析
                    continue;   
            }
            if (template.match(startTagOpen)) {
                const startTagMatch = parseStartTag();
                // console.log(startTagMatch);
                const element = {  //最终形成的AST结构
                    type: 1,
                    tag: startTagMatch.tagName,
                    lowerCasedTag: startTagMatch.tagName.toLowerCase(),
                    attrsList: startTagMatch.attrs,
                    attrsMap: makeAttrsMap(startTagMatch.attrs),
                    parent: currentParent,
                    children: []
                }
                processIf(element);  //处理v-if的逻辑
                processFor(element); //处理v-for的逻辑
                if (!root) { //如果没有根节点就把自己设成根节点
                    root = element;
                }
                if (currentParent) { //如果有父亲节点那就把自己放入父亲节点的children数组里
                    currentParent.children.push(element);
                }
                if(!startTagMatch.unarySlash) {
                    stack.push(element);
                    currentParent = element;
                }
                continue;
            }
        } else {  //如果不是就说明是text
            text = template.substring(0,textEnd);
            advance(textEnd);
            let expression;
            if(expression = parseText(text)){  //如果是{{item}}这种
                currentParent.children.push({
                    type:2,
                    text,
                    expression
                })
            }else{  //如果是普通text
                currentParent.children.push({
                    type:3,
                    text
                })
            }
            continue;
        }
    }
    return root;
}
function makeAttrsMap(attrs) {  //把标签内的属性数组映射成对象形式
    if (Array.isArray(attrs)) {
        return attrs.reduce((pre, item) => {
            pre[item.name] = item.value;
            return pre;
        }, {})
    }
}
function parseStartTag() {
    const start = template.match(startTagOpen);
    if (start) {
        // console.log(start[1]);
        const match = {
            tagName:start[1],
            attrs: [],
            start: index
        }
        advance(start[0].length);
        let end, attr;
        while (!(end = template.match(startTagClose)) && (attr = template.match(singleAttr))) {
            advance(attr[0].length);
            match.attrs.push({
                name: attr[1], //属性名
                value: attr[3] //属性值
            });
        }
        if (end) {
            match.unarySlash = end[1]; //判断是否是自闭合标签的关键，，如果是自闭合标签，end[1]为'/'，如果不是end[1]为''
            advance(end[0].length);
            match.end = index;
            return match;
        }
    }
}
function parseEndTag(tagName) {
    let pos;
    for(pos = stack.length-1;pos>=0;pos--){
        if(stack[pos].lowerCasedTag === tagName.toLowerCase()){
            break;
        }
    }
    if(pos>=0){
        if (pos > 0) {
            currentParent = stack[pos - 1];
        } else {
            currentParent = null;
        }
        stack.length = pos;
    }
}
function parseText(text){   //解析{{item}}类型的文本   {{item}} {{item}}
    if(!defaultTagRE.test(text)) return;  //这里只是检测text是否有{{}}表达式，但可能里面还有普通文本
    const tokens = []; //使用一个tokens数组来存放解析的结果
    //这里又学习到正则匹配的新知识点，正则对象的exec方法
    //如果是全局匹配，可以通过正则对象的lastindex来确定匹配的开始位置，而且每执行一次exec都返回匹配成功一次的结果，等到匹配不到
    //就返回Null,并且把lastindex设置成为0
    //不加exec的全局匹配都是返回所有匹配结果
    let lastindex = defaultTagRE.lastIndex = 0; //开始设置为0
    let match,index;
    while((match = defaultTagRE.exec(text))){   
        index = match.index; //
        if(index>lastindex){
            tokens.push(JSON.stringify(text.slice(lastindex,index))); //截取了{{}}前面的普通文本
        }
        const exp = match[1].trim(); //这就是{{}}里面的变量
        tokens.push(`_s(${exp})`); //存入token
        lastindex = index+match[0].length; //改变lastindex
    }
    if(lastindex < text.length){  //如果最后匹配过程停止，但是text还有字符，那就说明这些字符都是普通文本，直接放入token
        tokens.push(JSON.stringify(text.slice(lastindex)));
    }
    return tokens.join('+');
    /*
        <div>hello,{name}!</div>
        这样的一段文本得到的token = ['hello,','_s(name)','!'];
        最终返回 'hello'+_s(name)+!;
    */
}





//----------------------------------------------------------------------------
//从这里开始为optimize部分
function getAndRemoveAttr(el,name){   //用来取得属性值，
    let val;
    if((val = el.attrsMap[name])!=null){
        const list = el.attrsList;
        for(let i = 0,l = list.length;i<l;i++){
            if(list[i].name === name){
                list.splice(i,1);
                break;
            }
        }
    }
    return val;
}
function processIf(el){  //用来处理v-if的逻辑，v-if="isShow"
    const exp = getAndRemoveAttr(el,'v-if');  //exp = "isShow"
    if(exp){
        el.if = exp;
        if(!el.ifConditions){
            el.ifConditions = [];
        }
        el.ifConditions.push({   //{exp:"isShow",block:el}
            exp,
            block:el
        })
    }
}
function processFor(el){  //用来处理v-for的逻辑 
    let exp;
    if((exp = getAndRemoveAttr(el,'v-for'))){  //v-for="item in arr"
        const forMatch = exp.match(forAliasRE); //["item in arr","item","arr"]
        el.for = forMatch[2].trim(); //得到 arr
        el.alias = forMatch[1].trim(); //得到item
    }
}
function isStatic(node){  //判断一个节点是否是静态节点
    /*
        判断的标准就是当type为2(表达式节点)则是非静态节点
        type为3时为静态节点
        另外如果存在v-if或者v-for的时候也是非静态节点
    */
    if(node.type === 2){
        return false;
    }
    if(node.type === 3){
        return true;
    }
    return (!node.if && !node.for);
}
function markStatic(node){
    /*
        markStatic为所有节点标记上static，遍历所有节点通过isStatic来判断当前节点是否是静态节点
        除此之外，会遍历当前节点的所有子节点，如果有一个子节点是非静态节点，那么当前节点也是非静态节点
    */
    node.static = isStatic(node);
    if(node.type === 1){
        for(let i = 0,l = node.children.length;i<l;i++){
            const child = node.children[i];
            markStatic(child);
            if(!child.static){
                node.static = false;
            }
        }
    }
}
function markStaticRoots(node){
    /*
        所谓静态根节点，首先自己必须是静态节点，然后必须有孩子节点，而且孩子节点并不是只有一个文本节点
        如果孩子节点只有一个文本节点，节点本身结构太简单，没有标记的必要
        由于上面markStatic的处理，所以如果一个节点是静态节点，其孩子节点一定为静态节点
        直接判断如果当前节点是静态节点而且孩子节点并不是只有一个文本节点，标记staticRoot = true
    */
    if(node.type === 1){
        if(node.static && node.children.length && !(
            node.children.length === 1 &&
            node.children[0].type === 3
        )){
            node.staticRoot = true;
            return;
        }else{
            node.staticRoot = false;
        }
        if(node.children.length){
            for(let i = 0,l=node.children.length;i<l;i++){
                markStaticRoots(node.children[i]);
            }
        }
    }
}
function optimize(rootAst){  //optimize的总处理
    markStatic(rootAst);
    markStaticRoots(rootAst);
}





//————————————————————————————————————————————————————————————————————————————————
//从这里开始是generate部分
//首先要知道vue中有些函数是有别名的
//比如说createElement的别名为_c，createTextNode的别名为_v,createEmptyNode为_e,rendList的别名为_l
//generate部分的思路就是遍历整颗ast树然后根据节点的类型来生成调用上面三个函数的字符串，仅仅是生成字符串，并不是直接调用了
function genIf(el){ //处理if条件的函数
    el.ifProcessed = true;  //表示已经处理过了
    if(!el.ifConditions.length){
        return '_e()';
    }
    return `(${el.ifConditions[0].exp})?${genElement(el.ifConditions[0].block)}:_e()`;
}
function genFor(el){
    el.forProcessed = true; //表示已经处理过了
    const exp = el.for;
    const alias = el.alias;
    const iterator1 = el.iterator1 ?`,${el.iterator1}`:'';
    const iterator2 = el.iterator2 ?`,${el.iterator2}`:'';
    //能循环的一定是元素节点，所以调用genElement
    return `_l((${exp}),function(${alias}${iterator1}${iterator2}){
        return ${genElement(el)};  
    })`
}
function genText(el){
    return `_v(${el.expression})`;
}
function genNode(el){  //这里没有对元素节点类型分得太细
    if(el.type === 1){ //如果是元素节点就调用genElement
        return genElement(el);
    }else{
        return genText(el);
    }
}
function genChildren(el){
    const children = el.children;
    if(children && children.length>0){
        //但是孩子节点的节点类型不确定，所以调用genNode
        return `${children.map(genNode).join(',')}`;
    }
}
function genElement(el){
    // console.log(el);
    if(el.if && !el.ifProcessed){ //如果有if属性而且还没处理过
        return genIf(el);
    }else if(el.for && !el.forProcessed){ //如果有for属性而且还没处理过
        return genFor(el);
    }else{
        const children = genChildren(el);
        let code;
        code = `_c('${el.tag}',{
            staticClass:${el.attrsMap && el.attrsMap['class']},
            class:${el.attrsMap && el.attrsMap[':class']},
        }${children ?`,${children}`:''})`
        return code;
    }
}
function generate(rootAst){
    const code = rootAst?genElement(rootAst):'_c("div")';
    return {
        render:`with(this){return ${code}}`
    }
}

const ast  = parseHTML();
optimize(ast);
console.log(ast);
const code = generate(ast);
console.log(code);