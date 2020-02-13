import {createDomElement,setAttrs} from './createElement'
let allPatches;
let index = 0;  //用于深度遍历的序号
let removelist = []; //用于存储需要删除的节点以及它的父节点
function patch(node,patches){
    //给某个元素打补丁
    allPatches  = patches;
    walk(node);
    console.log(removelist);
    removelist.forEach(item=>{
        item.parent.removeChild(item.node);
    })
}
function walk(node){
    let currentPatch = allPatches[index++];  //根据index找到某个元素对应的补丁
    let childNodes = node.childNodes;  //找到这个元素的孩子节点
    childNodes.forEach(child=>walk(child));  
    if(currentPatch){  //如果有补丁，那就根据补丁进行补丁操作
        doPatch(node,currentPatch);
    }
}
function doPatch(node,currentPatch){
    currentPatch.forEach(patch=>{  
        switch (patch.type){ //这里的操作有点像react的action，也是根据type来操作里面的data
            case "ATTRS": //如果是属性的补丁
                for(let key in patch.attr_patch){
                    let value  = patch.attr_patch[key];
                    if(value){  //用补丁设置属性
                        setAttrs(node,key,value);
                    }
                    else{
                        node.removeAttribute(key);
                    }
                }
                break;
            case "TEXT":  //如果是文本的补丁，直接操作textContent就可
                node.textContent = patch.text;
                break;
            case "REPLACE": //如果是替换的，那就直接替换
                let newNode = createDomElement(patch.newNode);
                node.parentNode.replaceChild(newNode,node);
                break;
            case "REMOVE": //如果是删除，应该使用removeChild，但是由于不是逆序遍历孩子节点
            //所以删除了某个孩子节点，后面孩子节点的遍历就会出错，导致补丁操作也出错
            //所以这里先不删除，而是用removelist存储起来要删除的节点和它的父节点，在补丁操作完毕之后再去根据removelist删除
                removelist.push({
                    parent:node.parentNode,
                    node:node
                })
                // node.parentNode.removeChild(node);
                break;
        }
    })
}
export default patch;