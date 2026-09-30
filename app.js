const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ORDER = ["Palermo","Rome","Milan","Copenhagen","Stockholm","Oslo","Helsinki","Reykjavík"];
const CHART = ORDER.concat(["San Francisco","New York","Dallas"]);
const SUNLINE = ["Palermo","Copenhagen","Stockholm","San Francisco"];
const REF = new Set(["San Francisco","New York","Dallas"]);
const TEMP_SCALE = [[0,"#08306b"],[0.18,"#2171b5"],[0.32,"#6baed6"],[0.42,"#c6dbef"],[0.5,"#ffffcc"],[0.58,"#fed976"],[0.7,"#fd8d3c"],[0.85,"#e31a1c"],[1,"#800026"]];
const SUN_SCALE = [[0,"#1b263b"],[0.2,"#415a77"],[0.4,"#e9c46a"],[0.7,"#f4a261"],[1,"#fff3b0"]];
const RAIN_SCALE = [[0,"#f7f3ea"],[0.35,"#9ecae1"],[0.7,"#3182bd"],[1,"#08519c"]];
const layoutBase = {
  font:{family:"Georgia, serif", size:13},
  paper_bgcolor:"#f7f4ef", plot_bgcolor:"#fffefb",
  margin:{l:70,r:20,t:50,b:80},
  legend:{orientation:"h", y:-0.22, font:{size:11}},
  xaxis:{showgrid:false}, yaxis:{gridcolor:"#eee6d9"}
};

let CITIES = {};

function hexAlpha(hex, a) {
  const n = hex.replace("#","");
  const r = parseInt(n.slice(0,2),16), g = parseInt(n.slice(2,4),16), b = parseInt(n.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawCharts() {
  Plotly.newPlot("heat", [{
    type:"heatmap", z:CHART.map(n => CITIES[n].mean), x:MONTHS, y:CHART.map(n=>CITIES[n].label),
    colorscale:TEMP_SCALE, zmin:20, zmax:90,
    hovertemplate:"<b>%{y}</b><br>%{x}: %{z:.0f}°F<extra></extra>",
    colorbar:{title:"°F"}
  }], Object.assign({}, layoutBase, {title:"Monthly mean temperature (°F)", height:500, margin:{l:210,r:40,t:50,b:40}}));

  const rangeTraces = [];
  CHART.forEach(n => {
    const d = CITIES[n], ref = REF.has(n);
    rangeTraces.push({
      x: MONTHS.concat([...MONTHS].reverse()),
      y: d.high.concat([...d.low].reverse()),
      fill:"toself", fillcolor: hexAlpha(d.color, 0.12), line:{color:"rgba(0,0,0,0)"},
      hoverinfo:"skip", showlegend:false, legendgroup:n
    });
    rangeTraces.push({
      x:MONTHS, y:d.mean, mode:"lines+markers", name:d.label, legendgroup:n,
      line:{color:d.color, width: ref?3:2.4, dash: ref?"dash":"solid"},
      marker:{size: ref?7:6, symbol: ref?"diamond":"circle"},
      hovertemplate:"<b>"+d.label+"</b><br>%{x} mean: %{y:.0f}°F<extra></extra>"
    });
  });
  Plotly.newPlot("range", rangeTraces, Object.assign({}, layoutBase, {
    title:"Typical daily mean with high–low band (°F)", height:500, hovermode:"x unified",
    yaxis:{gridcolor:"#eee6d9", range:[10,105], title:"°F"}
  }));

  Plotly.newPlot("sunheat", [{
    type:"heatmap", z:CHART.map(n=>CITIES[n].sun_day), x:MONTHS, y:CHART.map(n=>CITIES[n].label),
    colorscale:SUN_SCALE, zmin:0.5, zmax:11,
    hovertemplate:"<b>%{y}</b><br>%{x}: %{z:.1f} hrs/day<extra></extra>",
    colorbar:{title:"hrs/day"}
  }], Object.assign({}, layoutBase, {title:"Average sunshine hours per day", height:500, margin:{l:210,r:40,t:50,b:40}}));

  Plotly.newPlot("sunline", SUNLINE.map(n => {
    const d = CITIES[n], ref = REF.has(n);
    return {
      x:MONTHS, y:d.sun_day, mode:"lines+markers", name:d.label,
      line:{color:d.color, width: ref?3:2.4, dash: ref?"dash":"solid"},
      marker:{size: ref?7:6, symbol: ref?"diamond":"circle"},
      hovertemplate:"<b>"+d.label+"</b><br>%{x}: %{y:.1f} hrs/day<extra></extra>"
    };
  }), Object.assign({}, layoutBase, {
    title:"Sunshine hours per day — Palermo, Copenhagen, Stockholm, San Francisco",
    height:460, hovermode:"x unified", yaxis:{gridcolor:"#eee6d9", range:[0,12], title:"hours / day"}
  }));

  Plotly.newPlot("precip", CHART.map(n => ({
    type:"bar", x:MONTHS, y:CITIES[n].precip, name:CITIES[n].label,
    marker:{color:CITIES[n].color}, opacity: REF.has(n)?0.95:0.88,
    hovertemplate:"<b>"+CITIES[n].label+"</b><br>%{x}: %{y:.2f} in<extra></extra>"
  })), Object.assign({}, layoutBase, {title:"Typical monthly precipitation (inches)", barmode:"group", height:440, yaxis:{title:"inches", gridcolor:"#eee6d9"}}));

  Plotly.newPlot("season", [
    {type:"bar", name:"January mean", x:CHART.map(n=>CITIES[n].label), y:CHART.map(n=>CITIES[n].mean[0]), marker:{color:"#3d5a80"}},
    {type:"bar", name:"July mean", x:CHART.map(n=>CITIES[n].label), y:CHART.map(n=>CITIES[n].mean[6]), marker:{color:"#ee6c4d"}}
  ], Object.assign({}, layoutBase, {title:"Seasonal swing: January vs July mean (°F)", barmode:"group", height:420, xaxis:{tickangle:-22}, legend:{orientation:"h", y:1.08}}));
}

function drawCards() {
  const root = document.getElementById("cards");
  root.innerHTML = CHART.map(n => {
    const d = CITIES[n];
    return `<article class="card">
      <div class="card-top" style="border-color:${d.color}">
        <h3>${d.label}</h3>
        <p class="region">${d.region} · ${d.sun_year.toLocaleString()} sun hours / year</p>
      </div>
      <div class="stats">
        <div><span>Jan mean</span><b>${Math.round(d.mean[0])}°F</b></div>
        <div><span>Jul mean</span><b>${Math.round(d.mean[6])}°F</b></div>
        <div><span>Jul sun</span><b>${d.sun_day[6]} h/d</b></div>
      </div>
      <dl>
        <dt>Winter</dt><dd>${d.feel.winter}</dd>
        <dt>Spring</dt><dd>${d.feel.spring}</dd>
        <dt>Summer</dt><dd>${d.feel.summer}</dd>
        <dt>Autumn</dt><dd>${d.feel.autumn}</dd>
      </dl>
    </article>`;
  }).join("");
}

let metric = "temp", month = 6;

function bindControls() {
  const monthRow = document.getElementById("monthRow");
  MONTHS.forEach((m,i) => {
    const b = document.createElement("button");
    b.textContent = m; b.dataset.i = i;
    if (i===month) b.classList.add("on");
    b.onclick = () => { month=i; [...monthRow.children].forEach(x=>x.classList.toggle("on", +x.dataset.i===month)); drawMap(); };
    monthRow.appendChild(b);
  });
  document.getElementById("metricSeg").addEventListener("click", e => {
    const btn = e.target.closest("button[data-metric]");
    if (!btn) return;
    metric = btn.dataset.metric;
    [...e.currentTarget.children].forEach(x => x.classList.toggle("on", x===btn));
    drawMap();
  });
}

function drawMap() {
  const vals = ORDER.map(n => metric==="temp" ? CITIES[n].mean[month] : metric==="sun" ? CITIES[n].sun_day[month] : CITIES[n].precip[month]);
  let cmin,cmax,scale,ctitle,sizes;
  if (metric==="temp") { cmin=20;cmax=82;scale=TEMP_SCALE;ctitle="Mean °F"; sizes=vals.map(v=>16+(v-20)*0.38); }
  else if (metric==="sun") { cmin=0.5;cmax=11;scale=SUN_SCALE;ctitle="Sun hrs/day"; sizes=vals.map(v=>15+v*2.4); }
  else { cmin=0.1;cmax=4.6;scale=RAIN_SCALE;ctitle="Rain inches"; sizes=vals.map(v=>14+v*8); }
  const hover = ORDER.map(n => {
    const d=CITIES[n];
    return `<b>${d.label}</b><br>${MONTHS[month]} mean ${d.mean[month]}°F (high ${d.high[month]}° / low ${d.low[month]}°)<br>Sunshine ${d.sun_day[month]} hrs/day · ${d.sun_h[month]} hrs/month<br>Rain ${d.precip[month]} in`;
  });
  Plotly.react("eumap", [{
    type:"scattergeo", lon:ORDER.map(n=>CITIES[n].lon), lat:ORDER.map(n=>CITIES[n].lat),
    text:ORDER, mode:"markers+text", textposition:"top center",
    textfont:{size:12,color:"#1c1917",family:"Georgia"},
    marker:{size:sizes,color:vals,colorscale:scale,cmin,cmax,colorbar:{title:ctitle,len:0.55,thickness:14},line:{width:1.3,color:"white"}},
    hovertext:hover, hoverinfo:"text"
  }], {
    geo: {
      scope:"europe", projection:{type:"natural earth", scale:1.15}, center:{lat:52,lon:10},
      showland:true, landcolor:"#efe8dc", showocean:true, oceancolor:"#d5e4ee",
      showlakes:true, lakecolor:"#d5e4ee", showcountries:true, countrycolor:"#c4b8a4",
      coastlinecolor:"#8a7d6b", bgcolor:"#f4efe6", resolution:50,
      lonaxis:{range:[-32,42]}, lataxis:{range:[33,72]}, fitbounds:false
    },
    dragmode:"pan", uirevision:"keep-camera", margin:{l:0,r:0,t:10,b:0},
    paper_bgcolor:"#f4efe6", font:{family:"Georgia, serif"}, height:680
  }, {scrollZoom:true, responsive:true, displaylogo:false, modeBarButtonsToRemove:["lasso2d","select2d","toImage"]});
}

fetch("cities.json")
  .then(r => r.json())
  .then(data => {
    CITIES = data;
    bindControls();
    drawMap();
    drawCharts();
    drawCards();
  });
