const Discord = require("discord.js");
const settings = require("./settings.json");
const fs = require("fs");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
var url = "https://site.na.wotvffbe.com";
require("dotenv").config();
const client = new Discord.Client();
const token = process.env.RAGNIBOT_TOKEN || "";
const statsCsvPath = "./WOTVSheet.csv";
const charInfoPath = "./Library_of_Knowledge_-_Characters.csv";
const csv = require("csvtojson");
let statsData = [];
let heroData = [];

client.on("ready", () => {
  csv()
    .fromFile(statsCsvPath)
    .then((jsonObj) => {
      statsData = jsonObj;
    });
  csv()
    .fromFile(charInfoPath)
    .then((jsonObj) => {
      heroData = jsonObj;
    });
  setInterval(() => {
    updateNotice()
    // .then(() => {
    //   updateEvent()
      // .then(() => {
      //   updateImp();
      // });
    // });
  }, 60000);
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on("reconnecting", () => {
  console.log(`${client.user.tag} is reconnecting`);
});
client.on("disconnect", () => {
  console.log(`${client.user} is disconnected`);
});

client.on("message", (msg) => {
  let commands = msg.content.toLowerCase().split(" ");
  if (commands[0] === settings.prefix + "setupdatechannel") {
    //setupdatechannel channel
    let channel = msg.mentions.channels.array()[0];
    if (!channel) return;
    settings.updateChannel = channel.id;
    fs.writeFile("settings.json", JSON.stringify(settings, " ", 2), function (
      err
    ) {
      if (err) console.log(err);
    });
  }
  if(msg.content.startsWith("!forcenotice")) {
    updateNotice()
  }
  // if(msg.content.startsWith("!forceevent")) {
  //   updateEvent()
  // }
  if (msg.content.startsWith("!ragni")) {
    return msg.reply(
      'If you want information on a unit, type `!unit "unit name"`'
    );
  }
  if (msg.content.startsWith("!unit")) {
    let noStatsString = ''
    let unitName = msg.content.replace("!unit", "").trim()
    if (commands[1] === undefined) {
      return msg.reply(
        'If you want information on a unit, type `!unit "unit name"`'
      );
    }
    let heroStats = statsData.find((hero) =>
      hero["Character name"].toLowerCase() === unitName.toLowerCase()
    );
    let heroInfo = heroData.find((hero) =>
      hero["Name"].toLowerCase() === unitName.toLowerCase()
    );
    if (heroStats === undefined && heroInfo === undefined) {
      return msg.reply("could not find a character named " + unitName + ". Ensure you are entering the name exactly as it is spelled in-game. If the mistake is on the bot's end, ask Markonnen to fix it.");
    }
    if (heroStats === undefined && heroInfo) {
      noStatsString = 'N/A'
    }
    const embed = {
      title: heroStats ? heroStats["Character name"] : heroInfo["Name"],
      fields: [
        {
          name: "Rarity",
          value: `${heroInfo["Rarity"]}`,
        },
        {
          name: "Character Overview",
          value: heroInfo["Short Character Overview(WIP)"],
        },
        {
          name: "Recommended Build",
          value: heroInfo["Recommended Build"],
        },
      ],
      color: "0x00AE86",
    };
    return msg.channel.send({ embed: embed });
  }
});

function updateNotice() {
  return new Promise((resolve) => {
    if (!settings.updateChannel) {
      resolve(0);
    } else {
      puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
        ]
      }).then((browser) => {
        browser.newPage().then((page) => {
          page.goto("https://site.na.wotvffbe.com//whatsnew").then(() => {
            setTimeout(() => {
              page.content().then((cont) => {
                const $ = cheerio.load(cont);
                let list = $("li.postList_item");
                if (
                  list[0].children[3].children[1].children[0].data ===
                  settings.notices
                ) {
                  //TODO close broswer async
                  browser.close().then(() => {
                    resolve(0);
                  })
                  .catch((err) => {
                    console.log(err)
                  });
                } else if (!settings.notices) {
                  settings.notices =
                    list[0].children[3].children[1].children[0].data;
                  fs.writeFile(
                    "settings.json",
                    JSON.stringify(settings, " ", 2),
                    function (err) {
                      if (err) console.log(err);
                    }
                  );
                  browser.close().then(() => {
                    resolve(0);
                  })
                  .catch((err) => {
                    console.log(err)
                  });
                } else {
                  let article = $("div.article_body");
                  let articleTitleSelector = $("#article_title")
                  let articleTitle = articleTitleSelector[0].children[0].data
                  let headerImage = $("div.article_header_image > img")
                  let headerImageUrl = ''
                  if (headerImage[0]){
                    headerImageUrl = url + headerImage[0].attribs.src
                    headerImageUrl =  new URL(headerImageUrl)
                  }
                  let text =
                    list[0].children[3].children[1].children[0].data + "\n";
                  for (let i = 0; i < article[0].children.length; i++) {
                    if (article[0].children[i].data) {
                      text += article[0].children[i].data;
                    } else {
                      //children[j] ... attribs.src
                      let children = article[0].children[i].children;
                      for (let j = 0; j < children.length; j++) {
                        if (children[j].data) {
                          text += children[j].data;
                        } else if (children[j].name === "img") {
                          console.log("lul");
                          let embed = new Discord.MessageEmbed();
                          embed.setDescription(text);
                          embed.setImage(url + children[j].attribs.src);
                          client.channels
                            .cache
                            .get(settings.updateChannel)
                            .send(embed);
                          text = "";
                        } else {
                          if (children[j].children) {
                            if (children[j].children[0]) {
                              if (children[j].children[0].data) {
                                text += children[j].children[0].data;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  let embed = new Discord.MessageEmbed();
                  embed.setTitle(articleTitle)
                  embed.setImage(headerImageUrl)
                  embed.setDescription(text);
                  client.channels.cache.get(settings.updateChannel).send(embed);
                  settings.notices =
                    list[0].children[3].children[1].children[0].data;
                  fs.writeFile(
                    "settings.json",
                    JSON.stringify(settings, " ", 2),
                    function (err) {
                      if (err) console.log(err);
                    }
                  );
                  browser.close().then(() => {
                    resolve(0);
                  })
                  .catch((err) => {
                    console.log(err)
                  });
                }
              })
              .catch((err) => {
                console.log(err)
              })
              .catch((err) => {
                console.log(err)
              });
            }, 1000);
          })
          .catch((err) => {
            console.log(err)
          });
        })
        .catch((err) => {
          console.log(err)
        });
      })
      .catch((err) => {
        console.log(err)
      });
    }
  })
  .catch((err) => {
    console.log(err)
  })
}

// function updateEvent() {
//   return new Promise((resolve) => {
//     if (!settings.updateChannel) {
//       resolve(0);
//     } else {
//       puppeteer.launch({
//         headless: true,
//         args: [
//           '--no-sandbox',
//         ]
//       }).then((browser) => {
//         browser.newPage().then((page) => {
//           page.goto("https://site.na.wotvffbe.com//whatsnew").then(() => {
//             setTimeout(() => {
//               page.content().then((cont) => {
//                 //todo checking for update
//                 //next category
//                 page.click("label.tabList_item-event", "middle").then(() => {
//                   setTimeout(() => {
//                     page.content().then((cont2) => {
//                       var $ = cheerio.load(cont2);
//                       let list = $("li.postList_item");
//                       if (
//                         list[0].children[3].children[1].children[0].data ===
//                         settings.events
//                       ) {
//                         browser.close().then(() => {
//                           resolve(0);
//                         })
//                       } else if (!settings.events) {
//                         settings.events =
//                           list[0].children[3].children[1].children[0].data;
//                         fs.writeFile(
//                           "settings.json",
//                           JSON.stringify(settings, " ", 2),
//                           function (err) {
//                             if (err) console.log(err);
//                           }
//                         );
//                         browser.close().then(() => {
//                           resolve(0);
//                         })
//                       } else {
//                         let article = $("div.article_body");
//                         let articleTitleSelector = $("#article_title")
//                         let articleTitle = articleTitleSelector[0].children[0].data
//                         let text = "";
//                         for (let i = 0; i < article[0].children.length; i++) {
//                           if (article[0].children[i].data) {
//                             text += article[0].children[i].data;
//                           } else {
//                             //children[j] ... attribs.src
//                             let children = article[0].children[i].children;
//                             for (let j = 0; j < children.length; j++) {
//                               if (children[j].data) {
//                                 text += children[j].data;
//                               } else if (children[j].name === "img") {
//                                 let embed = new Discord.MessageEmbed();
//                                 embed.setTitle(articleTitle)
//                                 embed.setDescription(text);
//                                 embed.setImage(url + children[j].attribs.src);
//                                 client.channels
//                                   .cache
//                                   .get(settings.updateChannel)
//                                   .send(embed);
//                                 text = "";
//                               } else {
//                                 if (children[j].children) {
//                                   if (children[j].children[0]) {
//                                     if (children[j].children[0].data) {
//                                       text += children[j].children[0].data;
//                                     }
//                                   }
//                                 }
//                               }
//                             }
//                           }
//                         }
//                         let embed = new Discord.MessageEmbed();
//                         embed.setTitle(articleTitle)
//                         embed.setDescription(text);
//                         client.channels.cache.get(settings.updateChannel).send(embed);
//                         settings.events =
//                           list[0].children[3].children[1].children[0].data;
//                         fs.writeFile(
//                           "settings.json",
//                           JSON.stringify(settings, " ", 2),
//                           function (err) {
//                             if (err) console.log(err);
//                           }
//                         );
//                         browser.close().then(() => {
//                           resolve(0);
//                         });
//                       }
//                     });
//                   }, 3000);
//                 });
//               });
//             }, 1000);
//           });
//         });
//       });
//     }
//   });
// }

// function updateImp() {
//   return new Promise((resolve) => {
//     if (!settings.updateChannel) {
//       resolve(0);
//     } else {
//       puppeteer.launch({
//         headless: true,
//         args: [
//             '--no-sandbox',
//           ]
//       }).then((browser) => {
//         browser.newPage().then((page) => {
//           page.goto("https://site.na.wotvffbe.com//whatsnew").then(() => {
//             setTimeout(() => {
//               page.content().then((cont) => {
//                 //todo checking for update
//                 //next category
//                 page
//                   .$eval("label.tabList_item-important", (elem) => elem.click())
//                   .then(() => {
//                     setTimeout(() => {
//                       page.content().then((cont2) => {
//                         var $ = cheerio.load(cont2);
//                         let list = $("li.postList_item");
//                         if (
//                           list[0].children[3].children[1].children[0].data ===
//                           settings.important
//                         ) {
//                           browser.close().then(() => {
//                             resolve(0);
//                           })
//                         } else if (!settings.important) {
//                           settings.important =
//                             list[0].children[3].children[1].children[0].data;
//                           console.log(list[0].children[3].children[1].children[0].data)
//                           fs.writeFile(
//                             "settings.json",
//                             JSON.stringify(settings, " ", 2),
//                             function (err) {
//                               if (err) console.log(err);
//                             }
//                           );
//                           browser.close().then(() => {
//                             resolve(0);
//                           })
//                         } else {
//                           let article = $("div.article_body");
//                           let text = "";
//                           for (let i = 0; i < article[0].children.length; i++) {
//                             if (article[0].children[i].data) {
//                               text += article[0].children[i].data;
//                             } else {
//                               //children[j] ... attribs.src
//                               let children = article[0].children[i].children;
//                               for (let j = 0; j < children.length; j++) {
//                                 if (children[j].data) {
//                                   text += children[j].data;
//                                 } else if (children[j].name === "img") {
//                                   let embed = new Discord.MessageEmbed();
//                                   embed.setDescription(text);
//                                   embed.setImage(url + children[j].attribs.src);
//                                   client.channels
//                                     .cache
//                                     .get(settings.updateChannel)
//                                     .send(embed);
//                                   text = "";
//                                 } else {
//                                   if (children[j].children) {
//                                     if (children[j].children[0]) {
//                                       if (children[j].children[0].data) {
//                                         text += children[j].children[0].data;
//                                       }
//                                     }
//                                   }
//                                 }
//                               }
//                             }
//                           }
//                           let embed = new Discord.MessageEmbed();
//                           embed.setDescription(text);
//                           client.channels
//                             .cache
//                             .get(settings.updateChannel)
//                             .send(embed);
//                           settings.important =
//                             list[0].children[3].children[1].children[0].data;
//                           fs.writeFile(
//                             "settings.json",
//                             JSON.stringify(settings, " ", 2),
//                             function (err) {
//                               if (err) console.log(err);
//                             }
//                           );
//                           browser.close().then(() => {
//                             resolve(0);
//                           })
//                         }
//                       });
//                     }, 3000);
//                   });
//               });
//             }, 1000);
//           });
//         });
//       });
//     }
//   });
// }

client.login(token);
