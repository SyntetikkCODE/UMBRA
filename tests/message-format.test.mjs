import test from 'node:test';
import assert from 'node:assert/strict';
import {formatMessage} from '../src/message-format.mjs';
const players=[{id:'one',name:'Aldo'},{id:'two',name:'Jean Paul'}];
test('Discord formatting: emphasis, underline, spoilers, headings, subtext, lists, quotations and code',()=>{
 const result=formatMessage('# Titre\n## Moyen\n### Petit\n-# discret\n\n**gras** *italique* __souligné__ ~~barré~~ ||secret||\n\n- item\n  - imbriqué\n\n1. numéro\n\n> citation\n\n```js\nconst value = 1;\n```');
 for(const tag of ['<h1>','<h2>','<h3>','chat-subtext','<strong>','<em>','<u>','<s>','chat-spoiler','<ul>','<ol>','<blockquote>','<pre>','hljs-keyword'])assert.ok(result.html.includes(tag),tag);
 assert.ok(formatMessage('>>> premier\ndeuxième').html.includes('premier<br>\ndeuxième'));
});
test('Mentions resolve full names; code, escaped mentions and link destinations never ping',()=>{
 const result=formatMessage('Salut @Aldo et @Jean Paul, <@one> @everyone',players);assert.deepEqual(result.mentions,['one','two']);assert.equal(result.everyone,true);
 const quiet=formatMessage('`@Aldo`\n```\n@everyone\n```\n\\@Aldo [lien](https://example.com/@Aldo)',players);assert.deepEqual(quiet.mentions,[]);assert.equal(quiet.everyone,false);
 assert.equal(formatMessage('@Aldos test@email.fr',players).mentions.length,0);
});
test('Untrusted text cannot become HTML, executable links, attributes or remote image embeds',()=>{
 const html=formatMessage('<img src=x onerror=alert(1)> <script>evil()</script> [x](javascript:alert(1)) ![alt](https://tracking.example/image.png)',players).html;
 assert.ok(!html.includes('<img')&&!html.includes('<script')&&!html.includes('href="javascript:'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('src="https://tracking'));
});
