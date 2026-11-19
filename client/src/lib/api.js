export async function request(engine,path,{method='GET',body}={}){
 const response=await fetch(`/api/${engine}${path}`,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json()}catch{throw new Error('Unable to read the server response.');}
 if(!response.ok)throw new Error(data.error || `Request failed (${response.status})`);
 return data;
}
