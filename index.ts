import { writeFileSync } from 'fs';
const { RPCClient } = require("@iangregsondev/rpc-bitcoin");
//=============== CONFIG ===============
const url = "http://127.0.0.1";
const user = "";
const pass = "";
const port = 8332;
const DEPTH = 100
const MIN_BLOCK_HEIGHT = 698666
//======================================
const timeout = 10000;
const client = new RPCClient({ url, port, timeout, user, pass });
const verbosity = 3;
let COMPLETE = []

async function main() {

  const tips = await client.getchaintips();
  for (let index in tips){
      if (tips[index].status == "valid-fork" || tips[index].status == "active" || tips[index].status == "invalid"){
        if (parseInt(tips[index].height) <= MIN_BLOCK_HEIGHT){
          continue;
        }
        let result = {}
       
        result["tipBlockhash"] = tips[index].hash
        result["tipHeight"] = tips[index].height
        result["chainStatus"] = tips[index].status
        result["coinbaseStringsDesc"] = []
        let blockhash = tips[index].hash;
        for (var i = 0; i < DEPTH; i++){
          try{
            let block = await client.rpc("getblock", { blockhash , verbosity });
            blockhash = block.hash
            result["coinbaseStringsDesc"].push(
              { 
                height : (parseInt(result["tipHeight"]) - i),
                hash : block.hash,
                coinbaseString:  getCoinBaseHuman(block.tx[0].vin[0].coinbase) 
              })
            blockhash = block.previousblockhash
            }catch (ex: unknown){
               console.log(ex)
               result["coinbaseStringsDesc"].push({ height : (parseInt(result["tipHeight"]) - i), error : ex["message"] + " Not checking further."})
               continue; // dont bother going further
           }
        }
        console.log(result)
        COMPLETE.push(result);       
      }
  }
  writeFileSync('output.json',JSON.stringify(COMPLETE))
}
function getCoinBaseHuman(h :string){
  return hex2a(h.trim().replace("\r\n"," "))
}

async function getCoinbaseStringFromBlockHash(blockhash : string) {
  let block = await client.rpc("getblock", { blockhash , verbosity });
  return hex2a(block.tx[0].vin[0].coinbase)
}

function hex2a(hexx:string) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

main();