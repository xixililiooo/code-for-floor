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
        如果当前节点是静态节点而且孩子节点并不是只有一个文本节点，标记staticRoot = true
    */
    if(node.type === 1){
        if(node.static && node.child.length && !(
            node.children.length === 1 &&
            node.children[0].type === 3
        )){
            node.staticRoot = true;
            return;
        }else{
            node.staticRoot = false;
        }
    }
}
function optimize(rootAst){  //有了以上的函数，就可以实现optimize了
    markStatic(rootAst);
    markStaticRoots(rootAst);
}
module.exports = {
    optimize
}