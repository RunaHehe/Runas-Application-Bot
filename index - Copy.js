const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events
} = require('discord.js');

const TOKEN = "tokenhere";
const PREFIX = "!";
const OWNER_ID = "1087521357849428020"; // This is needed to prevent members from spamming !apply 24/7 (because my members like to spam quite a lot!)
const APPLICATION_CHANNEL = "1478967439869083688"; // The variable name should explain this, but this is where submitted applications will end up

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "apply") {

        if (message.author.id !== OWNER_ID) {
            return message.reply("You are missing permissions to use this command.");
        }

        const embed = new EmbedBuilder() // This is the embed that gets sent when typing !apply, this should be pretty obvious
            .setTitle("Runa Empire Mod Apps")
            .setDescription("Click the button below to apply")
            .setColor(0x5865F2);

        const button = new ButtonBuilder()
            .setCustomId("open_application")
            .setLabel("Open Application")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

client.on(Events.InteractionCreate, async (interaction) => {

    if (interaction.isButton()) {

        if (interaction.customId === "open_application") {

            const modal = new ModalBuilder() // This is the actual "form" modal built into discord itself
                .setCustomId("application_modal")
                .setTitle("Application Form");

            const question1 = new TextInputBuilder() // Also unfortunately I'm limited to 5 rows, I can't go any higher lmao :p
                .setCustomId("portfolio")
                .setLabel("If you have a portfolio, please link it here.")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const question2 = new TextInputBuilder()
                .setCustomId("age")
                .setLabel("How old are you?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const question3 = new TextInputBuilder()
                .setCustomId("reason")
                .setLabel("Why do you want to be a moderator?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const question4 = new TextInputBuilder()
                .setCustomId("time")
                .setLabel("What is your timezone?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const question5 = new TextInputBuilder()
                .setCustomId("experience")
                .setLabel("Do you have any prior moderation experience?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const row1 = new ActionRowBuilder().addComponents(question1);
            const row2 = new ActionRowBuilder().addComponents(question2);
            const row3 = new ActionRowBuilder().addComponents(question3);
            const row4 = new ActionRowBuilder().addComponents(question4);
            const row5 = new ActionRowBuilder().addComponents(question5);

            modal.addComponents(row1, row2, row3, row4, row5);

            await interaction.showModal(modal);
        }

            if (interaction.customId.startsWith("accept_")) {

                const userId = interaction.customId.split("_")[1];
                const guild = interaction.guild;

                const member = await guild.members.fetch(userId);

                const role = await guild.roles.fetch("1478965245509636348"); // Role that you want to assign to your members if you accept their application, this is just my moderator role

                await member.roles.add(role);

                try {
                    await member.send("Hello! This is an automated DM to let you know that your mod app for Runa Empire was **accepted!** The mod role should have been automatically granted to you, but please dm me (Runa, the one writing this rn) if it wasn't. Thanks for applying!");
                } catch {
                    console.log("Could not DM user.");
                }

                await interaction.update({
                    content: `Application accepted for <@${userId}>`,
                    embeds: interaction.message.embeds,
                    components: []
                });
            }

        if (interaction.customId.startsWith("reject_")) {

            const userId = interaction.customId.split("_")[1];
            const guild = interaction.guild;

            const member = await guild.members.fetch(userId);

            try {
                await member.send("Hello! This is an automated DM to let you know that unfortunately your mod app for Runa Empire was **rejected.** Thank you so so so much for applying, but something in your application either wasn't good enough or just didn't make the cut due to other applicants.");
            } catch {
                console.log("Could not DM user.");
            }

            await interaction.update({
                content: `Application rejected for <@${userId}>`,
                embeds: interaction.message.embeds,
                components: []
            });
        }
    }

        if (interaction.isModalSubmit()) {

        if (interaction.customId === "application_modal") {
            
            const portfolio = interaction.fields.getTextInputValue("portfolio");
            const age = interaction.fields.getTextInputValue("age");
            const reason = interaction.fields.getTextInputValue("reason");
            const time = interaction.fields.getTextInputValue("time");
            const experience = interaction.fields.getTextInputValue("experience");

            const channel = await client.channels.fetch(APPLICATION_CHANNEL);

            const resultEmbed = new EmbedBuilder() // Embed that gets sent to the application channel ID you set earlier, this should also be pretty obvious
                .setTitle("Application submitted :3")
                .addFields(
                    { name: "User", value: `<@${interaction.user.id}>` },
                    { name: "Portfolio", value: portfolio },
                    { name: "Age", value: age },
                    { name: "Reason", value: reason},
                    { name: "Timezone", value: time},
                    { name: "Prior Experience", value: experience}
                )
                .setColor(0x57F287)
                .setTimestamp();

            const acceptButton = new ButtonBuilder()
                .setCustomId(`accept_${interaction.user.id}`)
                .setLabel("Accept")
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId(`reject_${interaction.user.id}`)
                .setLabel("Reject")
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

            await channel.send({
                embeds: [resultEmbed],
                components: [actionRow]
            });

            await interaction.deferUpdate();
        }
    }
});

client.login(TOKEN);