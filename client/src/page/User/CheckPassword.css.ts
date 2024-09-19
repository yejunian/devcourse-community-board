import { style } from "@vanilla-extract/css";

export const checkPasswordWrapper = style({
	position: "relative",
	width: "460px",
	height: "100%",
	boxSizing: "border-box",
	border: "1px solid #ccc",
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "stretch",
	padding: "24px",
	gap: "10px",
});

export const noPasswordMessage = style({
	margin: "24px 0 0 0",
});
