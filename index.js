const Discord = require("discord.js");
const axios = require("axios");
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
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on("reconnecting", () => {
  console.log(`${client.user.tag} is reconnecting`);
});
client.on("disconnect", () => {
  console.log(`${client.user} is disconnected`);
});

client.on("message", (msg) => {
  if (msg.content.startsWith("!ragni")) {
    return msg.reply('If you want information on a unit, type `!unit "unit name"`')
  }
  if (msg.content.startsWith("!unit")) {
    let commands = msg.content.split(" ");
    let heroStats = statsData.find(
      (hero) =>
        hero["Character name"].toLowerCase().includes(commands[1].toLowerCase())
    );
    let heroInfo = heroData.find(
      (hero) => hero["Name"].toLowerCase().includes(commands[1].toLowerCase())
    );
    if (heroStats === undefined || heroInfo === undefined) {
      return msg.reply("could not find a character named " + commands[1]);
    }
    const embed = {
      title: heroStats["Character name"],
      fields: [
        {
          name: "Rarity",
          value: `${heroInfo["Rarity"]}`,
        },
        {
          name: "HP",
          value: heroStats["HP"],
          inline: true,
        },
        {
          name: "Atk",
          value: heroStats["Attack"],
          inline: true,
        },
        {
          name: "TP",
          value: heroStats["TP"],
          inline: true,
        },
        {
          name: "Mag",
          value: heroStats["Magic"],
          inline: true,
        },
        {
          name: "AP",
          value: heroStats["AP"],
          inline: true,
        },
        {
          name: "Agi",
          value: heroStats["Quickness"],
          inline: true,
        },
        {
          name: "Move",
          value: heroStats["Move"],
          inline: true,
        },
        {
          name: "Dex",
          value: heroStats["Dexterity"],
          inline: true,
        },
        {
          name: "Jump",
          value: heroStats["Jump"],
          inline: true,
        },
        {
          name: "Luck",
          value: heroStats["Luck"],
          inline: true,
        },
        {
          name: "Character Overview",
          value: heroInfo['Short Character Overview(WIP)']
        },
        {
          name: "Master Ability Effect",
          value: heroInfo['Master Ability Effect']
        },
        {
          name: "Recommended Build",
          value: heroInfo['Recommended Build']
        }
      ],
      color: "0x00AE86",
    };
    return msg.channel.send({ embed: embed })
  }
});

client.login(token);
