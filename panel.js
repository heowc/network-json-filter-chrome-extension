var DEFAULT_JSON = "{}";

var logArea = document.querySelector('#log-area');
var url = document.querySelector('#url');
var expression = document.querySelector('#expression');
var autoScroll = document.querySelector("#checkbox-autoscroll");
var autoClear = document.querySelector("#checkbox-autoclear");
var onOff = document.querySelector("#checkbox-onoff");
var pretty = document.querySelector("#checkbox-pretty");
var toggleOpen = document.querySelector("#toggle-open");
var toggleClose = document.querySelector("#toggle-close");

chrome.devtools.network.onRequestFinished.addListener(request => {
   if (!onOff.checked) {
    return;
  }

  if (!isJsonType(request)) {
    return;
  }
 
  var urlValue = url.value;
  if (urlValue) {
    if (!request.request.url.includes(urlValue)) {
      return;
    }
  }

  request.getContent(function (content) {
    var expressionValue = expression.value;
    if (autoClear.checked) {
      logArea.innerHTML = '';
    }
    if (!expressionValue) {
      appendToPanel(content);
      return;
    }

    var result = jsonpath.query(JSON.parse(content), expressionValue)
    if (result.length > 0) {
      appendToPanel(JSON.stringify(result[0]));
    } else {
      appendToPanel(DEFAULT_JSON);
    }
  });
});

function isJsonType(request) {
  return request.response.content.mimeType === 'application/json';
}

function appendToPanel(value) {
  // span
  var spanNode = generateSpan();
  var jsonStr;
  try {
    if (pretty.checked) {
      jsonStr = JSON.stringify(JSON.parse(value), undefined, 2);
    } else {
      jsonStr = JSON.stringify(JSON.parse(value));
    }
  } catch (e) {
    jsonStr = value;
  }

  // pre(json content)
  var preNode = generatePre(jsonStr);
  // p
  var pNode = document.createElement("p");
  pNode.appendChild(spanNode);
  pNode.appendChild(preNode);
  // hr
  var hrNode = document.createElement("hr");
  
  logArea.appendChild(pNode);
  logArea.appendChild(hrNode);
  
  // focus
  if (autoScroll.checked) {
    hrNode.scrollIntoView();
  }
}

function generateSpan() {
  var spanNode = document.createElement("span");
  spanNode.className = 'arrow expanded'
  spanNode.textContent = '▼';
  spanNode.dataset.display = 'true';
  spanNode.addEventListener('click', function(e) {
    const isExpanded = this.classList.toggle('expanded');
    this.classList.toggle('collapsed', !isExpanded);
    this.textContent = isExpanded ? '▼' : '▶';
  });
  return spanNode;
}

function generatePre(content) {
  var preNode = document.createElement("pre");
  preNode.textContent = content;
  return preNode;
}

function getMiddleVisibleElement() {
  const rect = logArea.getBoundingClientRect();
  const middleY = rect.top + rect.height / 2;

  const elements = [...logArea.querySelectorAll("p")];
  return elements.find(el => {
    const r = el.getBoundingClientRect();
    return r.top <= middleY && r.bottom >= middleY;
  });
}

// Expand all button
toggleOpen.addEventListener("click", () => {
  const target = getMiddleVisibleElement();

  requestAnimationFrame(() => {
    logArea.querySelectorAll(".arrow").forEach(arrow => {
      arrow.classList.add("expanded");
      arrow.classList.remove("collapsed");
      arrow.textContent = "▼";
    });

    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "center" });
    }
  });
});

// Collapse all button
toggleClose.addEventListener("click", () => {
  const target = getMiddleVisibleElement();

  requestAnimationFrame(() => {
    logArea.querySelectorAll(".arrow").forEach(arrow => {
      arrow.classList.add("collapsed");
      arrow.classList.remove("expanded");
      arrow.textContent = "▶";
    });

    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "center" });
    }
  });
});


/* =========================== event =========================== */
document.querySelector('#clear').addEventListener('click', function(e) {
  logArea.innerHTML = '';
});