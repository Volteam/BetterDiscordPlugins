//META{"name":"ReactionImages"}*//

class ReactionImages {
	
    getName() { return "ReactionImages"; }
    getDescription() { return "Allows you to set reaction image folders and send reaction images with 'Folder Name/reaction image name'."; }
    getVersion() { return "1.0.3"; }
	getAuthor() { return "Metalloriff"; }
	getChanges() {
		return {
			
		};
	}

    load() {}

    start() {

        let libLoadedEvent = () => {
            try{ this.onLibLoaded(); }
            catch(err) { console.error(this.getName(), "fatal error, plugin could not be started!", err); }
        };

		let lib = document.getElementById("NeatoBurritoLibrary");
		if(lib == undefined) {
			lib = document.createElement("script");
			lib.setAttribute("id", "NeatoBurritoLibrary");
			lib.setAttribute("type", "text/javascript");
			lib.setAttribute("src", "https://rawgit.com/Metalloriff/BetterDiscordPlugins/master/Lib/NeatoBurritoLibrary.js");
			document.head.appendChild(lib);
		}
        if(typeof window.NeatoLib !== "undefined") libLoadedEvent();
        else lib.addEventListener("load", libLoadedEvent);

	}

	getSettingsPanel() {

		setTimeout(() => {

			let group = NeatoLib.Settings.Elements.createGroup("Reaction folders"), list = group.lastChild;

			group.style.padding = "20px 0px";

			group.insertAdjacentHTML("afterbegin", `<style>.ri-selected{background-color:#7289da;border-radius:5px;}</style>`);

			let populateList = () => {

				list.innerHTML = "";

				this.selectedFolder = undefined;

				for(let i in this.settings.folders) {

					list.appendChild(NeatoLib.Settings.Elements.createTextField(i, "text", this.settings.folders[i].path, e => {

						let newPath = e.target.value, newName = newPath.substring(newPath.lastIndexOf("/") + 1, newPath.length);

						if(this.fs.existsSync(newPath) && newName != i) {
							this.settings.folders[newName] = { path : newPath, files : [] };
							delete this.settings.folders[i];
							this.refreshFolderDatas();
							populateList();
						} else if(newName != i) NeatoLib.showToast("This folder does not exist!", "error");

					}));

					list.lastChild.setAttribute("id", "ri-" + i);

					list.lastChild.addEventListener("click", e => {
						for(let selected of document.getElementsByClassName("ri-selected")) selected.classList.remove("ri-selected");
						this.selectedFolder = i;
						e.currentTarget.classList.add("ri-selected");
					});

				}

				list.appendChild(NeatoLib.Settings.Elements.createButton("Add Folder", () => {
					NeatoLib.browseForFile(folder => {
						let path = folder.path.split("\\").join("/");
						this.settings.folders[path.substring(path.lastIndexOf("/") + 1, path.length)] = { path : path, files : [] };
						this.refreshFolderDatas();
						populateList();
					}, { directory : true });
				}, "margin-right:20px;margin-top:20px;"));

				list.appendChild(NeatoLib.Settings.Elements.createButton("Remove Selected Folder", () => {
					delete this.settings.folders[this.selectedFolder];
					this.refreshFolderDatas();
					populateList();
				}, "margin-left:20px"));

			};

			NeatoLib.Settings.pushElement(group, this.getName());

			populateList();

			NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createHint("Hint: Hold shift when clicking a reaction image to send the image alone, without the message and without clearing the chat box."), this.getName());

			NeatoLib.Settings.pushChangelogElements(this);

		}, 0);

		return NeatoLib.Settings.Elements.pluginNameLabel(this.getName());
		
	}

	saveSettings() {
		NeatoLib.Settings.save(this);
	}

	onLibLoaded() {

		NeatoLib.Updates.check(this);
		
		this.settings = NeatoLib.Settings.load(this, {
			displayUpdateNotes : true,
			folders : {}
		});
		
        //if(this.settings.displayUpdateNotes) NeatoLib.Changelog.compareVersions(this.getName(), this.getChanges());
        
		this.fs = require("fs");
		
		this.refreshFolderDatas();

        this.onChatInput = (e, shuffle) => {

			if(e.key.includes("Arrow")) return;

			let noneFound = true, autocomplete = document.getElementById("ri-autocomplete");

			for(let folderName in this.folders) {

				let chatbox = e.target, idx = chatbox.value.lastIndexOf(folderName + "/");

				if(idx == -1) continue;
				else noneFound = false;

				let folder = this.folders[folderName], sendFile = NeatoLib.Modules.get("upload").upload;

				if(folder) {

					if(!autocomplete) {

						chatbox.parentElement.insertAdjacentHTML("beforeend", `
							<div id="ri-autocomplete" class="autocomplete-1vrmpx autocomplete-i9yVHs" style="width:inherit">
								<div class="autocompleteInner-zh20B_">
									<div class="autocompleteRowVertical-q1K4ky autocompleteRow-2OthDa">
										<div class="selector-2IcQBU">
											<div class="contentTitle-2tG_sM small-29zrCQ size12-3R0845 height16-2Lv3qA weightSemiBold-NJexzi">Files in ${folderName}</div>
										</div>
									</div>
									<div id="ri-autocomplete-list" class="flex-1xMQg5 flex-1O1GKY horizontal-1ae9ci horizontal-2EEEnY flex-1O1GKY directionRow-3v3tfG justifyStart-2NDFzi alignStretch-DpGPf3 noWrap-3jynv6 horizontalAutocompletes-x8hlrn scrollbarGhostHairline-1mSOM1 scrollbar-3dvm_9" style="flex: 1 1 auto;">
										
									</div>
								</div>
							</div>
						`);

						autocomplete = document.getElementById("ri-autocomplete");

						let buttons = document.getElementsByClassName("selector-2IcQBU")[0];

						let shuffleButton = document.createElement("img");

						shuffleButton.src = "https://material.io/tools/icons/static/icons/round-shuffle-24px.svg";
						shuffleButton.style.filter = "invert(40%)";
						shuffleButton.style.cursor = "pointer";

						shuffleButton.addEventListener("click", () => this.onChatInput(e, true));

						buttons.appendChild(shuffleButton);

						NeatoLib.Tooltip.bind("Shuffle", shuffleButton);

					}

					let list = document.getElementById("ri-autocomplete-list");

					list.innerHTML = "";

					let i = 0, searchFilter = chatbox.value.substring(idx + folderName.length + 1, chatbox.length), filteredResults = searchFilter ? Array.filter(folder.files, x => x.fileName.toLowerCase().includes(searchFilter)) : folder.files;

					if(shuffle) filteredResults = NeatoLib.shuffleArray(filteredResults);

					for(let file of filteredResults) {

						if(i >= 15) continue;

						list.insertAdjacentHTML("beforeend", `
							<div class="horizontalAutocomplete-1DAQoM autocompleteRowHorizontal-32jwnH autocompleteRow-2OthDa">
								<div class="selectorSelected-1_M1WV selector-2IcQBU selectable-3dP3y-"><img src="${file.iconData}" onmouseenter="this.src = 'data:image/${file.type};base64, ${file.data}'" onmouseleave="this.src = '${file.iconData}'" width="100" height="100"></div>
							</div>
						`);

						let images = list.getElementsByTagName("img");
						
						new PluginTooltip.Tooltip($(images[images.length - 1]), file.fileName, { side : "top" });

						images[images.length - 1].addEventListener("click", e => {

							let channel = NeatoLib.getSelectedTextChannel();

							if(e.shiftKey) sendFile(channel.id, new File([this.fs.readFileSync(file.path)], file.fileName));
							else {
								
								sendFile(channel.id, new File([this.fs.readFileSync(file.path)], file.fileName), { content :  chatbox.value.substring(0, idx), tts : false });

								chatbox.select();
								document.execCommand("delete");

								autocomplete.outerHTML = "";

							}

						});

						i++;

					}

				} else if(autocomplete) autocomplete.outerHTML = "";

			}

			if(noneFound && autocomplete) autocomplete.outerHTML = "";

        };

		NeatoLib.Events.onPluginLoaded(this);
		
		this.switch();

		this.switchEvent = () => this.switch();

		NeatoLib.Events.attach("switch", this.switchEvent);

	}

	refreshFolderDatas() {
		NeatoLib.showToast("ReactionImages: Loading reaction data and generating icons, Discord may freeze temporarily.");
		this.folders = jQuery.extend(true, {}, this.settings.folders);
		for(let i in this.folders) {
			this.folders[i].files = [];
			let list = this.fs.readdirSync(this.settings.folders[i].path);
			for(let ii = 0; ii < list.length; ii++) {

				if(list[ii].indexOf(".") == -1) continue;

				let data = this.fs.readFileSync(this.settings.folders[i].path + "/" + list[ii], { encoding : "base64" });

				let fileType = list[ii].substring(list[ii].lastIndexOf(".") + 1, list[ii].length);

				if(fileType != "jpg" && fileType != "png" && fileType != "gif") continue;

				let generatedFile = this.settings.folders[i].files.find(x => x.fileName == list[ii] && x.size == data.length);

				if(generatedFile) {
					this.folders[i].files.push({ fileName : list[ii], type : fileType, size : data.length, data : data, iconData : generatedFile.iconData, path : this.settings.folders[i].path + "/" + list[ii] });
					continue;
				}

				let fileWithExistingName = this.settings.folders[i].files.findIndex(x => x.fileName == list[ii]);

				if(fileWithExistingName != -1) delete this.settings.folders[i].files[fileWithExistingName];

				let icon = new Image();

				icon.onload = () => {

					let iconData = this.compressImageToIcon(icon);

					this.settings.folders[i].files.push({ fileName : list[ii], size : data.length, iconData : iconData });
					this.folders[i].files.push({ fileName : list[ii], type : fileType, size : data.length, data : data, iconData : iconData, path : this.settings.folders[i].path + "/" + list[ii] });

					icon = null;

				};

				icon.src = `data:image/${fileType};base64, ${data}`;

			}
		}
		setTimeout(() => this.saveSettings(), 0);
	}

	compressImageToIcon(unconverted) {
		
		let canvas = document.createElement("canvas"), context = canvas.getContext("2d");

		canvas.width = 100;
		canvas.height = 100;

		context.drawImage(unconverted, 0, 0, 100, 100);

		return canvas.toDataURL("image/jpeg", 0.3);

	}

    switch() {

        if(!this.ready) return;

        this.chatbox = NeatoLib.Chatbox.get();

        if(this.chatbox) this.chatbox.addEventListener("keyup", this.onChatInput);

    }
	
    stop() {
		if(this.chatbox) this.chatbox.removeEventListener("keyup", this.onChatInput);
		NeatoLib.Events.detach("switch", this.switchEvent);
	}
	
}
