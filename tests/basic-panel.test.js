const assert = require('node:assert/strict');

global.window = {
  getExploreJsonString: () => '',
};

const RULE_TYPES = {
  explore: { fields: [] }, search: { fields: [] },
  bookInfo: { fields: [] }, toc: { fields: [] }, content: { fields: [] },
};
const CF_LOGIN_CHECK_JS = 'var x = result;';

let state = {
  activeRuleType: 'search',
  rules: {
    explore: { fields: {}, fieldStates: {} },
    search: { fields: {}, fieldStates: {} },
    bookInfo: { fields: {}, fieldStates: {} },
    toc: { fields: {}, fieldStates: {} },
    content: { fields: {}, fieldStates: {} },
  },
  exploreUrl: '',
  searchUrl: '',
  bookSourceType: 0,
  bookSourceUrl: 'https://example.com',
  bookSourceName: '测试源',
  bookSourceComment: '这是一个测试注释',
  headerItems: [],
  loginCheckJs: CF_LOGIN_CHECK_JS,
};

function buildRuleSection(type) {
  const rule = state.rules[type];
  const fields = RULE_TYPES[type].fields;
  const section = {};
  fields.forEach(f => {
    const fd = rule.fields[f.key];
    if (fd && fd.value) section[f.key] = fd.value;
  });
  return section;
}

function generateJson() {
  const exploreResult = '';
  const result = {
    ruleSearch: buildRuleSection('search'),
    ruleBookInfo: buildRuleSection('bookInfo'),
    ruleToc: buildRuleSection('toc'),
    ruleContent: buildRuleSection('content'),
    ruleExplore: buildRuleSection('explore'),
    bookSourceType: Number(state.bookSourceType) || 0,
    bookSourceUrl: (state.bookSourceUrl || '').trim(),
    bookSourceName: (state.bookSourceName || '').trim(),
    searchUrl: state.searchUrl || '',
    exploreUrl: exploreResult,
  };

  if (state.bookSourceComment && state.bookSourceComment.trim()) {
    result.bookSourceComment = state.bookSourceComment.trim();
  }

  const items = Array.isArray(state.headerItems) ? state.headerItems : [];
  const header = {};
  items.forEach(item => {
    const key = (item?.key || '').trim();
    const value = (item?.value || '').trim();
    if (key && value) header[key] = value;
  });
  if (Object.keys(header).length > 0) result.header = header;

  if (state.loginCheckJs && state.loginCheckJs.trim()) {
    result.loginCheckJs = state.loginCheckJs.trim();
  }

  return result;
}

// Test 1
let json = generateJson();
assert.equal(json.bookSourceComment, '这是一个测试注释', 'bookSourceComment should be present');
assert.equal(json.loginCheckJs, CF_LOGIN_CHECK_JS, 'loginCheckJs should be present');

// Test 2
state.bookSourceComment = '';
json = generateJson();
assert.equal(json.bookSourceComment, undefined, 'empty comment should not appear');

// Test 3
state.loginCheckJs = '';
json = generateJson();
assert.equal(json.loginCheckJs, undefined, 'empty loginCheckJs should not appear');

// Test 4
json = generateJson();
assert.equal(json.header, undefined, 'empty header should not appear');

// Test 5: header with content
state.headerItems = [{ key: 'User-Agent', value: 'Mozilla' }];
json = generateJson();
assert.deepStrictEqual(json.header, { 'User-Agent': 'Mozilla' }, 'non-empty header should appear');
state.headerItems = [];

console.log('basic-panel tests passed');
