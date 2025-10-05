var DEFAULT_JSON = "{}";

var logArea = document.querySelector('#log-area');
var url = document.querySelector('#url');
var expression = document.querySelector('#expression');
var followTail = document.querySelector('#checkbox-follow-tail')



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
  if (!isJsonType(request)) {
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
  // pre(json content)
  var preNode = generatePre(JSON.stringify(JSON.parse(value), undefined, 2));
  // p
  var pNode = document.createElement("p");
  pNode.appendChild(spanNode);
  pNode.appendChild(preNode);
  // hr
  var hrNode = document.createElement("hr");
  
  logArea.appendChild(pNode);
  logArea.appendChild(hrNode);
  
  // focus
  if (followTail.checked) {
    hrNode.scrollIntoView();
  }
}

function generateSpan() {
  var spanNode = document.createElement("span");
  spanNode.className = 'arrow'
  spanNode.textContent = '▼';
  //spanNode.style = 'width:15px;height:15px;display:block;'
  spanNode.dataset.display = 'true';
  spanNode.addEventListener('click', function(e) {
    if (this.dataset.display === 'true') {
      this.textContent = '▶';
      this.dataset.display = 'false';
      this.nextElementSibling.style = 'display:none';
    } else {
      this.textContent = '▼';
      this.dataset.display = 'true';
      this.nextElementSibling.style = '';
    }
  });

  return spanNode;
}

function generatePre(content) {
  var preNode = document.createElement("pre");
  preNode.textContent = content;
  return preNode;
}

/* =========================== event =========================== */
document.querySelector('#clear').addEventListener('click', function(e) {
  logArea.innerHTML = '';
});