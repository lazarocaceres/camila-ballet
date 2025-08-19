import{R as o}from"./index.CQ95-tCy.js";var _={exports:{}},y={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var w;function q(){if(w)return y;w=1;var t=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function r(i,a,n){var u=null;if(n!==void 0&&(u=""+n),a.key!==void 0&&(u=""+a.key),"key"in a){n={};for(var m in a)m!=="key"&&(n[m]=a[m])}else n=a;return a=n.ref,{$$typeof:t,type:i,key:u,ref:a!==void 0?a:null,props:n}}return y.Fragment=e,y.jsx=r,y.jsxs=r,y}var S;function N(){return S||(S=1,_.exports=q()),_.exports}var T=N();function J(t){const e=JSON.stringify({query:t.query,variables:t.variables}),r=o.useMemo(()=>A(e),[e]),i=o.useMemo(()=>{if(t.data){const p=JSON.parse(JSON.stringify(t.data));return v(r,p,[])}},[t.data,r]),[a,n]=o.useState(i),[u,m]=o.useState(!1),[h,x]=o.useState(!1),[E,k]=o.useState(!1);return o.useEffect(()=>{m(!0),n(i),parent.postMessage({type:"url-changed"})},[r,i]),o.useEffect(()=>{if(h){let p=function(s){const g=s.target.getAttributeNames().find(f=>f.startsWith("data-tina-field"));let c;if(g)s.preventDefault(),s.stopPropagation(),c=s.target.getAttribute(g);else{const f=s.target.closest("[data-tina-field], [data-tina-field-overlay]");if(f){const b=f.getAttributeNames().find(R=>R.startsWith("data-tina-field"));b&&(s.preventDefault(),s.stopPropagation(),c=f.getAttribute(b))}}c&&E&&parent.postMessage({type:"field:selected",fieldName:c},window.location.origin)};const d=document.createElement("style");return d.type="text/css",d.textContent=`
        [data-tina-field] {
          outline: 2px dashed rgba(34,150,254,0.5);
          transition: box-shadow ease-out 150ms;
        }
        [data-tina-field]:hover {
          box-shadow: inset 100vi 100vh rgba(34,150,254,0.3);
          outline: 2px solid rgba(34,150,254,1);
          cursor: pointer;
        }
        [data-tina-field-overlay] {
          outline: 2px dashed rgba(34,150,254,0.5);
          position: relative;
        }
        [data-tina-field-overlay]:hover {
          cursor: pointer;
          outline: 2px solid rgba(34,150,254,1);
        }
        [data-tina-field-overlay]::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 20;
          transition: opacity ease-out 150ms;
          background-color: rgba(34,150,254,0.3);
          opacity: 0;
        }
        [data-tina-field-overlay]:hover::after {
          opacity: 1;
        }
      `,document.head.appendChild(d),document.body.classList.add("__tina-quick-editing-enabled"),document.addEventListener("click",p,!0),()=>{document.removeEventListener("click",p,!0),document.body.classList.remove("__tina-quick-editing-enabled"),d.remove()}}},[h,E]),o.useEffect(()=>{t?.experimental___selectFormByFormId&&parent.postMessage({type:"user-select-form",formId:t.experimental___selectFormByFormId()})},[r]),o.useEffect(()=>{const{experimental___selectFormByFormId:p,...d}=t;parent.postMessage({type:"open",...d,id:r},window.location.origin);const s=l=>{if(l.data.type==="quickEditEnabled"&&x(l.data.value),l.data.id===r&&l.data.type==="updateData"){const g=l.data.data,c=v(r,JSON.parse(JSON.stringify(g)),[]);n(c),k(!0),document.querySelector("[data-tina-field]")?parent.postMessage({type:"quick-edit",value:!0},window.location.origin):parent.postMessage({type:"quick-edit",value:!1},window.location.origin)}};return window.addEventListener("message",s),()=>{window.removeEventListener("message",s),parent.postMessage({type:"close",id:r},window.location.origin)}},[r,x]),{data:a,isClient:u}}const O=(t,e,r)=>{const i=t?._content_source;if(!i)return"";const{queryId:a,path:n}=i;if(!e)return`${a}---${n.join(".")}`;const u=[...n,e];return`${a}---${u.join(".")}`},v=(t,e,r=[])=>{if(e===null||M(e))return e;if(e instanceof String)return e.valueOf();if(Array.isArray(e))return e.map((a,n)=>v(t,a,[...r,n]));const i={};for(const[a,n]of Object.entries(e)){const u=[...r,a];["__typename","_sys","_internalSys","_values","_internalValues","_content_source","_tina_metadata"].includes(a)?i[a]=n:i[a]=v(t,n,u)}return i&&typeof i=="object"&&"type"in i&&i.type==="root"?i:{...i,_content_source:{queryId:t,path:r}}};function M(t){const e=typeof t;return e==="string"||e==="number"||e==="boolean"||e==="undefined"||t==null||t instanceof String||t instanceof Number||t instanceof Boolean}const A=t=>{let e=0;for(let a=0;a<t.length;a++){const n=t.charCodeAt(a);e=(e<<5)-e+n&4294967295}return Math.abs(e).toString(36)};export{T as j,O as t,J as u};
