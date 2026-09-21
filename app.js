const K={vehicle:"carlog_vehicle",fuel:"fuelRecords",maintenance:"carlog_maintenance",expenses:"carlog_expenses"};
let vehicle=load(K.vehicle,null),fuelRecords=load(K.fuel,[]),maintenanceRecords=load(K.maintenance,[]),expenseRecords=load(K.expenses,[]);
let editingFuelId=null,editingMaintenanceId=null,editingExpenseId=null,costYear=new Date().getFullYear(),chartBars=[];
document.addEventListener("DOMContentLoaded",()=>{setDates();vehicle?goHome():show("setupScreen")});
function load(k,f){try{let v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}}function store(k,v){localStorage.setItem(k,JSON.stringify(v))}
function id(p){return p+"_"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random().toString(16).slice(2))}
function show(x){["setupScreen","homeScreen","fuelScreen","fuelHistoryScreen","maintenanceScreen","maintenanceHistoryScreen","expenseScreen","costScreen","settingsScreen"].forEach(i=>document.getElementById(i).classList.add("hidden"));document.getElementById(x).classList.remove("hidden");const nav=document.getElementById("bottomNav");if(nav)nav.classList.toggle("hidden",x==="setupScreen")}
function today(){let d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().split("T")[0]}function setDates(){fuelDate.value=today();maintenanceDate.value=today();expenseDate.value=today()}
function fmt(v){if(!v)return"";let[y,m,d]=v.split("-");return`${y}/${+m}/${+d}`}function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function vf(){return fuelRecords.filter(r=>!r.vehicleId||r.vehicleId===vehicle.id)}function vm(){return maintenanceRecords.filter(r=>r.vehicleId===vehicle.id)}function ve(){return expenseRecords.filter(r=>r.vehicleId===vehicle.id)}
function currentKm(){return Math.max(vehicle?.odometer||0,...vf().map(r=>r.odometer||0),...vm().map(r=>r.odometer||0))}
function saveInitialVehicle(){let name=setupVehicleName.value.trim(),km=+setupOdometer.value;if(!name||!km)return alert("車両名と現在走行距離を入力してください。");vehicle={id:id("vehicle"),name,maker:setupMaker.value.trim(),odometer:km,inspectionDate:setupInspectionDate.value,oilInterval:+setupOilInterval.value||5000,createdAt:new Date().toISOString()};store(K.vehicle,vehicle);goHome()}
function goHome(){editingFuelId=editingMaintenanceId=editingExpenseId=null;if(!vehicle)return show("setupScreen");show("homeScreen");updateHome()}
function recomputeFuel(){let rs=[...vf()].sort((a,b)=>a.odometer-b.odometer);rs.forEach((r,i)=>{let p=rs[i-1];r.distance=p?r.odometer-p.odometer:null;r.fuelEconomy=(p&&r.fullTank&&p.fullTank&&r.distance>0)?r.distance/r.liters:null;r.pricePerLiter=r.amount/r.liters});let ids=new Set(rs.map(r=>r.id));fuelRecords=fuelRecords.map(r=>ids.has(r.id)?rs.find(x=>x.id===r.id):r);store(K.fuel,fuelRecords)}
function latestOil(){return [...vm()].filter(r=>r.type==="オイル交換"||r.type==="オイル＋フィルター交換").sort((a,b)=>b.odometer-a.odometer)[0]||null}
function costsForMonth(y,m){let f=vf().filter(r=>{let[a,b]=r.date.split("-").map(Number);return a===y&&b===m}).reduce((s,r)=>s+r.amount,0),mt=vm().filter(r=>{let[a,b]=r.date.split("-").map(Number);return a===y&&b===m}).reduce((s,r)=>s+r.amount,0),o=ve().filter(r=>{let[a,b]=r.date.split("-").map(Number);return a===y&&b===m}).reduce((s,r)=>s+r.amount,0);return{fuel:f,maintenance:mt,other:o,total:f+mt+o}}
function updateHome(){
 if(!vehicle)return;
 const kmNow=Number(currentKm());
 if(Number.isFinite(kmNow)) vehicle.odometer=kmNow;
 else if(!Number.isFinite(Number(vehicle.odometer))) vehicle.odometer=0;
 store("carlog_vehicle",vehicle);
 document.getElementById("vehicleName").textContent=vehicle.name||"---";
 document.getElementById("vehicleMaker").textContent=vehicle.maker||"";
 document.getElementById("currentOdometer").textContent=fmt(Number(vehicle.odometer)||0)+" km";

 const now=new Date(), y=now.getFullYear(), m=now.getMonth();
 const monthFuel=fuelRecords.filter(r=>{const d=new Date(r.date+"T00:00:00");return d.getFullYear()===y&&d.getMonth()===m;});
 const fuelCost=monthFuel.reduce((s,r)=>s+(Number(r.amount)||0),0);
 const monthCost=costsForMonth(y,m+1);
 document.getElementById("monthlyFuelCost").textContent=fmt(fuelCost)+" 円";
 document.getElementById("monthlyTotalCost").textContent=fmt(monthCost)+" 円";

 const monthOdos=monthFuel.map(r=>Number(r.odometer)).filter(Number.isFinite).sort((a,b)=>a-b);
 let monthDistance=0;
 if(monthOdos.length>=2) monthDistance=Math.max(0,monthOdos[monthOdos.length-1]-monthOdos[0]);
 else if(monthOdos.length===1){
   const before=fuelRecords.filter(r=>r.date<monthFuel[0].date).sort((a,b)=>b.date.localeCompare(a.date))[0];
   if(before) monthDistance=Math.max(0,monthOdos[0]-Number(before.odometer||0));
 }
 document.getElementById("monthlyDistance").textContent=fmt(monthDistance)+" km";

 const econ=[...fuelRecords].filter(r=>Number(r.fuelEconomy)>0).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 document.getElementById("latestFuelEconomy").textContent=econ.length?Number(econ[0].fuelEconomy).toFixed(1)+" km/L":"記録なし";

 if(vehicle.inspectionDate){
   document.getElementById("inspectionInfo").textContent=vehicle.inspectionDate.replaceAll("-","/");
   const a=new Date(today()+"T00:00:00"),b=new Date(vehicle.inspectionDate+"T00:00:00");
   const days=Math.ceil((b-a)/86400000);
   document.getElementById("inspectionRemaining").textContent=days>=0?"あと "+fmt(days)+" 日":"期限切れ";
 }else{
   document.getElementById("inspectionInfo").textContent="未設定";
   document.getElementById("inspectionRemaining").textContent="";
 }

 const oil=latestOil();
 if(vehicle.oilInterval){
   const base=oil?Number(oil.odometer):Number(vehicle.odometer||0);
   const target=base+Number(vehicle.oilInterval);
   const remain=target-Number(vehicle.odometer||0);
   document.getElementById("oilInfo").textContent=fmt(target)+" km";
   document.getElementById("oilNext").textContent=remain>=0?"あと "+fmt(remain)+" km":"交換目安を "+fmt(Math.abs(remain))+" km 超過";
 }else{
   document.getElementById("oilInfo").textContent="未設定";
   document.getElementById("oilNext").textContent="";
 }

 const recent=[];
 fuelRecords.forEach(r=>recent.push({date:r.date,type:"給油",amount:Number(r.amount)||0,detail:(r.liters?Number(r.liters).toFixed(1)+" L":"")}));
 maintenanceRecords.forEach(r=>recent.push({date:r.date,type:r.type||"整備・修理",amount:Number(r.amount)||0,detail:r.memo||""}));
 expenseRecords.forEach(r=>recent.push({date:r.date,type:r.category||"その他支出",amount:Number(r.amount)||0,detail:r.memo||""}));
 recent.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 const box=document.getElementById("recentRecords");
 if(!recent.length) box.innerHTML='<div class="muted">まだ記録がありません</div>';
 else box.innerHTML=recent.slice(0,5).map(r=>'<div class="recent-row"><div><strong>'+esc(r.type)+'</strong><small>'+esc((r.date||"").replaceAll("-","/"))+(r.detail?" ・ "+esc(r.detail):"")+'</small></div><b>'+fmt(r.amount)+' 円</b></div>').join("");
}
function openFuelScreen(){editingFuelId=null;fuelScreenTitle.textContent="給油を記録";fuelSaveButton.textContent="登録";fuelDate.value=today();odometer.value=currentKm();liters.value="";amount.value="";fullTank.checked=true;show("fuelScreen")}
function saveFuel(){let rec={date:fuelDate.value,odometer:+odometer.value,liters:+liters.value,amount:+amount.value,fullTank:fullTank.checked};if(!rec.date||rec.odometer<=0||rec.liters<=0||rec.amount<=0)return alert("入力内容を確認してください。");if(vf().filter(r=>r.id!==editingFuelId).some(r=>r.odometer===rec.odometer))return alert("同じ走行距離の給油記録があります。");if(editingFuelId){let i=fuelRecords.findIndex(r=>r.id===editingFuelId);fuelRecords[i]={...fuelRecords[i],...rec}}else fuelRecords.push({id:id("fuel"),vehicleId:vehicle.id,...rec,createdAt:new Date().toISOString()});store(K.fuel,fuelRecords);recomputeFuel();vehicle.odometer=Math.max(vehicle.odometer||0,currentKm());store(K.vehicle,vehicle);goHome()}
function editFuel(x){let r=fuelRecords.find(r=>r.id===x);editingFuelId=x;fuelScreenTitle.textContent="給油記録を編集";fuelSaveButton.textContent="変更を保存";fuelDate.value=r.date;odometer.value=r.odometer;liters.value=r.liters;amount.value=r.amount;fullTank.checked=r.fullTank;show("fuelScreen")}function deleteFuel(x){if(!confirm("この給油記録を削除しますか？"))return;fuelRecords=fuelRecords.filter(r=>r.id!==x);store(K.fuel,fuelRecords);recomputeFuel();showFuelHistory()}
function showFuelHistory(){show("fuelHistoryScreen");fuelHistoryList.innerHTML="";let rs=[...vf()].sort((a,b)=>b.odometer-a.odometer);if(!rs.length)return fuelHistoryList.innerHTML='<div class="empty">まだ給油記録はありません。</div>';rs.forEach(r=>{let d=document.createElement("div");d.className="history-item";d.innerHTML=`<div class="history-head"><div class="history-date">${fmt(r.date)}</div><strong>${Number.isFinite(r.fuelEconomy)?r.fuelEconomy.toFixed(1)+" km/L":"---"}</strong></div><div class="history-info">${r.odometer.toLocaleString()} km ・ ${r.liters.toFixed(2)} L<br>${r.amount.toLocaleString()} 円 ・ ${r.pricePerLiter.toFixed(1)} 円/L</div><div class="record-actions"><button onclick="editFuel('${r.id}')">編集</button><button class="danger" onclick="deleteFuel('${r.id}')">削除</button></div>`;fuelHistoryList.appendChild(d)})}
function openMaintenanceScreen(){editingMaintenanceId=null;maintenanceScreenTitle.textContent="整備を記録";maintenanceSaveButton.textContent="登録";maintenanceDate.value=today();maintenanceType.value="オイル交換";maintenanceOdometer.value=currentKm();maintenanceAmount.value="";maintenanceMemo.value="";show("maintenanceScreen")}
function saveMaintenance(){let rec={date:maintenanceDate.value,type:maintenanceType.value,odometer:+maintenanceOdometer.value,amount:+maintenanceAmount.value||0,memo:maintenanceMemo.value.trim()};if(!rec.date||rec.odometer<=0||rec.amount<0)return alert("入力内容を確認してください。");if(editingMaintenanceId){let i=maintenanceRecords.findIndex(r=>r.id===editingMaintenanceId);maintenanceRecords[i]={...maintenanceRecords[i],...rec}}else maintenanceRecords.push({id:id("maintenance"),vehicleId:vehicle.id,...rec,createdAt:new Date().toISOString()});store(K.maintenance,maintenanceRecords);vehicle.odometer=Math.max(vehicle.odometer||0,currentKm());store(K.vehicle,vehicle);goHome()}
function editMaintenance(x){let r=maintenanceRecords.find(r=>r.id===x);editingMaintenanceId=x;maintenanceScreenTitle.textContent="整備記録を編集";maintenanceSaveButton.textContent="変更を保存";maintenanceDate.value=r.date;maintenanceType.value=r.type;maintenanceOdometer.value=r.odometer;maintenanceAmount.value=r.amount;maintenanceMemo.value=r.memo||"";show("maintenanceScreen")}function deleteMaintenance(x){if(!confirm("この整備記録を削除しますか？"))return;maintenanceRecords=maintenanceRecords.filter(r=>r.id!==x);store(K.maintenance,maintenanceRecords);showMaintenanceHistory()}
function showMaintenanceHistory(){show("maintenanceHistoryScreen");maintenanceHistoryList.innerHTML="";let rs=[...vm()].sort((a,b)=>b.date.localeCompare(a.date)||b.odometer-a.odometer);if(!rs.length)return maintenanceHistoryList.innerHTML='<div class="empty">まだ整備記録はありません。</div>';rs.forEach(r=>{let d=document.createElement("div");d.className="history-item";d.innerHTML=`<div class="history-head"><div><div class="history-date">${fmt(r.date)}</div><div class="history-type">${esc(r.type)}</div></div><strong>${r.amount.toLocaleString()} 円</strong></div><div class="history-info">${r.odometer.toLocaleString()} km${r.memo?`<div class="memo">${esc(r.memo)}</div>`:""}</div><div class="record-actions"><button onclick="editMaintenance('${r.id}')">編集</button><button class="danger" onclick="deleteMaintenance('${r.id}')">削除</button></div>`;maintenanceHistoryList.appendChild(d)})}
function openExpenseScreen(){editingExpenseId=null;expenseScreenTitle.textContent="その他の支出";expenseSaveButton.textContent="登録";expenseDate.value=today();expenseCategory.value="自動車税";expenseAmount.value="";expenseMemo.value="";show("expenseScreen")}
function saveExpense(){let rec={date:expenseDate.value,category:expenseCategory.value,amount:+expenseAmount.value,memo:expenseMemo.value.trim()};if(!rec.date||rec.amount<=0)return alert("日付と金額を入力してください。");if(editingExpenseId){let i=expenseRecords.findIndex(r=>r.id===editingExpenseId);expenseRecords[i]={...expenseRecords[i],...rec}}else expenseRecords.push({id:id("expense"),vehicleId:vehicle.id,...rec,createdAt:new Date().toISOString()});store(K.expenses,expenseRecords);showCosts()}
function editExpense(x){let r=expenseRecords.find(r=>r.id===x);editingExpenseId=x;expenseScreenTitle.textContent="支出を編集";expenseSaveButton.textContent="変更を保存";expenseDate.value=r.date;expenseCategory.value=r.category;expenseAmount.value=r.amount;expenseMemo.value=r.memo||"";show("expenseScreen")}function deleteExpense(x){if(!confirm("この支出を削除しますか？"))return;expenseRecords=expenseRecords.filter(r=>r.id!==x);store(K.expenses,expenseRecords);showCosts()}
function changeCostYear(n){costYear+=n;renderCosts()}function showCosts(){show("costScreen");setTimeout(renderCosts,0)}
function renderCosts(){costYearLabel.textContent=costYear+"年";let months=Array.from({length:12},(_,i)=>costsForMonth(costYear,i+1)),f=months.reduce((s,x)=>s+x.fuel,0),m=months.reduce((s,x)=>s+x.maintenance,0),o=months.reduce((s,x)=>s+x.other,0),total=f+m+o;yearTotal.textContent=total.toLocaleString()+" 円";yearFuelCost.textContent=f.toLocaleString()+" 円";yearMaintenanceCost.textContent=m.toLocaleString()+" 円";yearOtherCost.textContent=o.toLocaleString()+" 円";let now=new Date(),divisor=costYear===now.getFullYear()?now.getMonth()+1:12;if(costYear>now.getFullYear())divisor=12;monthlyAverageCost.textContent=Math.round(total/divisor).toLocaleString()+" 円";avgLabel.textContent=costYear===now.getFullYear()?"今年ここまでの月平均":"月平均";drawCostChart(months);drawFuelChart();renderExpenseHistory();selectedMonthCard.classList.add("hidden")}
function setupCanvas(c){let rect=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(300,rect.width),h=220;c.width=w*dpr;c.height=h*dpr;let ctx=c.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);return{ctx,w,h}}
function drawCostChart(months){let c=costChart,{ctx,w,h}=setupCanvas(c),pad={l:8,r:8,t:18,b:28},max=Math.max(...months.map(x=>x.total),1),gap=5,bw=(w-pad.l-pad.r-gap*11)/12;ctx.clearRect(0,0,w,h);ctx.font="11px sans-serif";ctx.textAlign="center";chartBars=[];months.forEach((x,i)=>{let bh=(x.total/max)*(h-pad.t-pad.b),left=pad.l+i*(bw+gap),top=h-pad.b-bh;ctx.fillStyle="#202631";ctx.fillRect(left,top,bw,bh);ctx.fillStyle="#737b87";ctx.fillText(String(i+1),left+bw/2,h-8);chartBars.push({left,right:left+bw,top:pad.t,bottom:h-pad.b,month:i+1})});c.onclick=e=>{let r=c.getBoundingClientRect(),x=(e.clientX-r.left)*(w/r.width),bar=chartBars.find(b=>x>=b.left&&x<=b.right);if(bar)showMonthDetail(bar.month,months[bar.month-1])}}
function showMonthDetail(mon,x){selectedMonthTitle.textContent=`${costYear}年${mon}月の内訳`;selectedMonthDetails.innerHTML=`<div class="detail-row"><span>ガソリン</span><strong>${x.fuel.toLocaleString()} 円</strong></div><div class="detail-row"><span>整備・修理</span><strong>${x.maintenance.toLocaleString()} 円</strong></div><div class="detail-row"><span>その他</span><strong>${x.other.toLocaleString()} 円</strong></div><div class="detail-row"><span>合計</span><strong>${x.total.toLocaleString()} 円</strong></div>`;selectedMonthCard.classList.remove("hidden")}
function drawFuelChart(){let c=fuelChart,{ctx,w,h}=setupCanvas(c),rs=[...vf()].filter(r=>Number.isFinite(r.fuelEconomy)).sort((a,b)=>a.odometer-b.odometer).slice(-12);ctx.clearRect(0,0,w,h);if(rs.length<2){fuelChartEmpty.textContent="燃費データが2件以上たまるとグラフを表示します。";return}fuelChartEmpty.textContent="";let vals=rs.map(r=>r.fuelEconomy),min=Math.max(0,Math.min(...vals)-2),max=Math.max(...vals)+2,p={l:34,r:12,t:18,b:30};ctx.strokeStyle="#d9dee5";ctx.beginPath();ctx.moveTo(p.l,p.t);ctx.lineTo(p.l,h-p.b);ctx.lineTo(w-p.r,h-p.b);ctx.stroke();ctx.strokeStyle="#202631";ctx.lineWidth=2;ctx.beginPath();rs.forEach((r,i)=>{let x=p.l+i*((w-p.l-p.r)/(rs.length-1)),y=p.t+(max-r.fuelEconomy)/(max-min)*(h-p.t-p.b);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.fillStyle="#202631";rs.forEach((r,i)=>{let x=p.l+i*((w-p.l-p.r)/(rs.length-1)),y=p.t+(max-r.fuelEconomy)/(max-min)*(h-p.t-p.b);ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill()});ctx.fillStyle="#737b87";ctx.font="11px sans-serif";ctx.textAlign="right";ctx.fillText(max.toFixed(1),p.l-5,p.t+4);ctx.fillText(min.toFixed(1),p.l-5,h-p.b)}
function renderExpenseHistory(){expenseHistoryList.innerHTML="";let es=[...ve()].sort((a,b)=>b.date.localeCompare(a.date));if(!es.length)return expenseHistoryList.innerHTML='<div class="empty">その他の支出はありません。</div>';es.forEach(r=>{let d=document.createElement("div");d.className="history-item";d.innerHTML=`<div class="history-head"><div><div class="history-date">${fmt(r.date)}</div><div class="history-type">${esc(r.category)}</div></div><strong>${r.amount.toLocaleString()} 円</strong></div>${r.memo?`<div class="history-info">${esc(r.memo)}</div>`:""}<div class="record-actions"><button onclick="editExpense('${r.id}')">編集</button><button class="danger" onclick="deleteExpense('${r.id}')">削除</button></div>`;expenseHistoryList.appendChild(d)})}
function openSettings(){show("settingsScreen");settingsVehicleName.value=vehicle.name;settingsMaker.value=vehicle.maker||"";settingsOdometer.value=currentKm();settingsInspectionDate.value=vehicle.inspectionDate||"";settingsOilInterval.value=vehicle.oilInterval||5000}
function saveVehicleSettings(){let name=settingsVehicleName.value.trim(),km=+settingsOdometer.value;if(!name||km<=0)return alert("車両名と走行距離を入力してください。");vehicle={...vehicle,name,maker:settingsMaker.value.trim(),odometer:km,inspectionDate:settingsInspectionDate.value,oilInterval:+settingsOilInterval.value||5000};store(K.vehicle,vehicle);goHome()}
function exportBackup(){
  const data={
    app:"CarLog",
    backupVersion:1,
    exportedAt:new Date().toISOString(),
    vehicle:vehicle,
    fuelRecords:fuelRecords,
    maintenanceRecords:maintenanceRecords,
    expenseRecords:expenseRecords
  };
  const json=JSON.stringify(data,null,2);
  const blob=new Blob([json],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  const d=new Date();
  const stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  a.href=url;
  a.download=`CarLog_Backup_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function importBackup(event){
  const file=event.target.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(data.app!=="CarLog" || !data.vehicle || !Array.isArray(data.fuelRecords) || !Array.isArray(data.maintenanceRecords) || !Array.isArray(data.expenseRecords)){
        throw new Error("invalid");
      }
      if(!confirm("現在のCarLogデータを、このバックアップ内容に置き換えますか？"))return;
      vehicle=data.vehicle;
      fuelRecords=data.fuelRecords;
      maintenanceRecords=data.maintenanceRecords;
      expenseRecords=data.expenseRecords;
      store(K.vehicle,vehicle);
      store(K.fuel,fuelRecords);
      store(K.maintenance,maintenanceRecords);
      store(K.expenses,expenseRecords);
      recomputeFuel();
      alert("バックアップから復元しました。");
      goHome();
    }catch(e){
      alert("CarLogのバックアップファイルとして読み込めませんでした。");
    }finally{
      event.target.value="";
    }
  };
  reader.onerror=()=>{
    alert("ファイルを読み込めませんでした。");
    event.target.value="";
  };
  reader.readAsText(file,"UTF-8");
}

function openQuickAdd(){
  const el=document.getElementById("quickAddBackdrop");
  if(el) el.classList.remove("hidden");
}
function closeQuickAdd(event){
  if(event && event.target!==document.getElementById("quickAddBackdrop")) return;
  const el=document.getElementById("quickAddBackdrop");
  if(el) el.classList.add("hidden");
}
function quickGo(kind){
  closeQuickAdd();
  if(!vehicle){ alert("先に車両を登録してください。"); return; }
  const actions={
    fuel:openFuelScreen,
    maintenance:openMaintenanceScreen,
    expense:openExpenseScreen
  };
  if(actions[kind]) actions[kind]();
}
