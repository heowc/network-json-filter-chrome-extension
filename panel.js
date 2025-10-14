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




// Pre-populating filter fields from localStorage
url.value = localStorage.getItem("lastUrl") || "";
expression.value = localStorage.getItem("lastExpression") || "";

// Saving filter fields to localStorage on change
url.addEventListener("input", () => {
  localStorage.setItem("lastUrl", url.value);
});
expression.addEventListener("input", () => {
  localStorage.setItem("lastExpression", expression.value);
});


// helper: checks if the filter looks like a regex pattern (starts and ends with '/')
function matchRegExp(filter){
   return filter.length > 2 && filter[0] === "/" && filter[filter.length - 1] === "/";
}

function matchesUrl(requestUrl, filter) {
  if (!filter) return true; // no filter = match all

  // --- case 1: regular expression ---
  // 1️⃣ Regular Expression (RegExp) — when filter starts and ends with "/"
  //     example:
  //       filter = "/api\\/v[0-9]+/"
  //       matchesUrl("https://example.com/api/v2/users", filter) → true

  if (matchRegExp(filter)) {
    try {
      var re = new RegExp(filter.slice(1, -1)); // remove surrounding slashes
      return re.test(requestUrl);
    } catch (e) {
      return false; // invalid regex
    }
  }


  // --- case 2: glob pattern (contains * or ?) ---
  // 2️⃣ Glob Pattern — when filter contains "*" or "?"
  //     "*" → matches any number of characters
  //     "?" → matches exactly one character
  //     examples:
  //       filter = "*.json"
  //       matchesUrl("https://example.com/data.json", filter) → true
  //
  //       filter = "*/user?.*"
  //       matchesUrl("https://example.com/users.txt", filter) → false
  if (filter.includes("*") || filter.includes("?")) {
    // Escape regex special chars except * and ?
    var globToRegex = filter
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    try {
      var re = new RegExp("^" + globToRegex + "$");
      return re.test(requestUrl);
    } catch (e) {
      return false;
    }
  }
  
  // --- case 3: substring match ---
  // 3️⃣ Simple Substring — fallback if filter is a plain string
  //     example:
  //       filter = "api/v1"
  //       matchesUrl("https://example.com/api/v1/user", filter) → true
  return requestUrl.includes(filter);
}

chrome.devtools.network.onRequestFinished.addListener(request => {
   if (!onOff.checked) {
    return;
  }

  var filterValue = url.value;
  if (filterValue) {
    if (!matchesUrl(request.request.url, filterValue)) {
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

    var result = jsonpath.query(JSON.parse(content), expressionValue);
    if (result.length > 0) {
      appendToPanel(JSON.stringify(result[0]));
    } else {
      appendToPanel(DEFAULT_JSON);
    }
  });
});

function isJsonType(request) {
  return request.response.content.mimeType === "application/json";
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
document.querySelector("#clear").addEventListener("click", function (e) {
  logArea.innerHTML = "";
});
