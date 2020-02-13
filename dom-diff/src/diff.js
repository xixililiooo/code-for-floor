function diffStyle(oldStyle,newStyle,patch){  //比较两个Style的不同
    for(let key in oldStyle){  //新的style值更新旧的style值
        if(oldStyle[key]!==newStyle[key]){
            patch['style'] = {[key]:newStyle[key]};
        }
    }
    for(let key in newStyle){  //新增的style
        if(!oldStyle[key]){
            patch['style'] = {[key]:newStyle[key]};
        }
    }
}
function diffAttr(oldProps,newProps){ //比较props的不同
    let patch = {}; //属性的不同全都放到一个patch对象中
    for(let key in oldProps){  //不同属性
        if(oldProps[key] !== newProps[key]){
            if(key === 'style'){  //如果属性是style，需要调用diffStyle进行特殊处理
                diffStyle(oldProps[key],newProps[key],patch);   
            }else{
                patch[key] = newProps[key];
            }
        }
    }
    for(let key in newProps){  //新增属性
        if(!oldProps[key]){
            patch[key] = newProps[key]
        }
    }
    return patch;  //把属性的补丁返回
}
let ATTRS = 'ATTRS';
let TEXT = 'TEXT';
let REMOVE = 'REMOVE';
let REPLACE = 'REPLACE';
let Index = 0;
function diffChildren(oldChildren,newChildren,index,patches){
    oldChildren.forEach((child,idx)=>{
        walk(child,newChildren[idx],++Index,patches)
    })
}
function walk(oldNode,newNode,index,patches){
    let currentPatch = [];  //描述每个元素的补丁，每个元素可能有很多补丁，所以要用数组
    if(!newNode){  //如果直接删除了某个节点
        currentPatch.push({
            type:REMOVE,
            index
        })
    }
    else if(!oldNode.type&&!newNode.type){  //两个节点都是文本虚拟dom，直接对比内容
        if(oldNode.text!==newNode.text){
            currentPatch.push({
                type:TEXT,
                text:newNode.text
            })
        }
    }
    else if(oldNode.type === newNode.type){ //类型相同才去比属性和孩子
        let attr_patch = diffAttr(oldNode.props,newNode.props);
        // console.log(attr_patch,index);
        if(Object.keys(attr_patch).length>0){
            currentPatch.push({
                type:ATTRS,
                attr_patch
            })
        }
        diffChildren(oldNode.children,newNode.children,index,patches);
    }else{
        //由于上面类型相同才去比属性和孩子，导致深度遍历的index出现误差
        //如果某个孩子的补丁类型是替换，后面还有孩子，那么由于深度遍历的index出现误差，后面孩子的补丁检测会出错
        Index++;//所以要index++
        currentPatch.push({
            type:REPLACE,
            newNode
        })
    }
    if(currentPatch.length>0){ //某个元素有补丁，那就把某个元素深度遍历的序号和补丁关联起来
        patches[index] = currentPatch;
    }
}
export default function Diff(oldTree,newTree){
    let patches = {};
    let index = 0;
    walk(oldTree,newTree,index,patches);
    return patches;
}
