import { Editor, getSnapshot, loadSnapshot } from "tldraw";
import FileService from "../api/FileService.ts";
import cardStates from "../cardStates.ts";
import { CardState } from "../types/hass.ts";

export default class CanvasStore {
	private editor: Editor; //the tldraw editor
	private cardName: string; // The Name of this Card
	private fileService: FileService; // An Instance of FileService
	private fileName: string;
	private userName: string;

	constructor(editor: Editor, cardName: string) {
		this.editor = editor;
		this.cardName = cardName;
		const cardState = cardStates.value[this.cardName] as CardState;
		if (!cardState?.hass?.value) {
			console.error("Missing hass for card:", cardName);
			return;
		}
		const { hass, config } = cardState;
		this.fileName = config.value.name;
		this.userName = hass.value.user.name;
		this.fileService = new FileService(
			hass.value.auth.data.hassUrl,
			hass.value.auth.data.access_token,
			this.userName,
		);
	}

	async saveSnapshotToServer(): Promise<void> {
		const { document } = getSnapshot(this.editor.store);
		try {
			await this.fileService.sendSnapShot(document, this.fileName);
		} catch (err) {
			console.error(err);
		}
	}

	async getSnapShotFromServer(): Promise<void> {
		try {
			const jsonData: string = await this.fileService.getSnapShot(
				this.fileName,
			);
			const document = JSON.parse(jsonData);
			this.editor.setCurrentTool("select");
			loadSnapshot(this.editor.store, { document });
		} catch (err) {
			console.error(err);
			return;
		}
	}
}
