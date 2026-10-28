// Receives secrets on hidden stdin and forwards them directly to Wrangler.
// No secret is printed, written to a file, or included in command arguments.
import {spawn} from 'node:child_process';
const cli=process.argv[2];if(!cli)throw Error('Pass the installed Wrangler CLI path.');
console.log('Ready for notification secrets JSON on hidden stdin.');
if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');let input='';
process.stdin.on('data',chunk=>{for(const c of chunk){if(c==='\u0003')process.exit(130);if(c==='\r'||c==='\n'){if(!input)return;const data=JSON.parse(input);input='';if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();const child=spawn(process.execPath,[cli,'secret','bulk'],{stdio:['pipe','inherit','inherit'],windowsHide:true});child.stdin.end(JSON.stringify(data));child.on('exit',code=>process.exit(code||0));return;}input+=c;}});
