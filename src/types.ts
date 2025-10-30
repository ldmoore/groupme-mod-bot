import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;

export enum IllegalContentType {
	Word = "word",
	Phrase = "phrase",
	Sequence = "sequence",
	None = "none",
}

export class IllegalMessageResult {
	containsIllegalContent: boolean;
	illegalContentType: IllegalContentType;

	constructor(
		containsIllegalContent: boolean,
		illegalContentType: IllegalContentType,
	) {
		this.containsIllegalContent = containsIllegalContent;
		this.illegalContentType = illegalContentType;
	}

	valueOf(): boolean {
		return this.containsIllegalContent;
	}

	toString(): string {
		return this.containsIllegalContent
			? `Illegal content detected: ${this.illegalContentType}`
			: "No illegal content";
	}
}
