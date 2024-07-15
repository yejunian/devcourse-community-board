import { style } from "@vanilla-extract/css";
import { vars } from "../../../App.css.ts";

export const ModalContainer = style({
    position : "absolute",
    top : "50%",
    left : "50%",
    transform : "translate(-50%, -50%)",
    width : "600px",
    height : "600px",
    background : vars.color.task,
    borderRadius : "5px",
    textAlign : "center"
});

export const ModalHeader = style({
    display : 'flex',
    justifyContent : "space-between",
    flexDirection : "row",
    height : "fit-content",
    flexWrap : "wrap",
    margin : 15
});

export const ModalBody = style({
    display : 'flex',
    flexDirection : "column",
    alignItems : "center",
    flexWrap : "wrap",
    width : "fit",
    height : "100%",
    rowGap : 15,
    margin : "20px"
});

export const PostHeaderTitle = style({
    display : 'flex',
    justifyContent : "center",
    alignItems : "center",
    color : vars.color.darkText,
    fontWeight : "bold"
});

export const PostBtn = style({
    backgroundColor : vars.color.successButton,
    color : vars.color.brightText
});

export const CloseBtn = style({
    backgroundColor : vars.color.brightText,
    borderColor : vars.color.deleteButton,
    color : vars.color.deleteButton
});

export const InputContainer = style({
    display : 'flex',
    flexDirection : "column",
    width : "100%"
});

export const InputIndex = style({
    display : 'flex',
    alignItems : "center",
    fontWeight : "bolder",
    color : vars.color.darkText,
    marginLeft : 10,
    marginBottom : 10,
    "::placeholder" : {
    }
});

export const TitleInput = style({
    backgroundColor : vars.color.brightText,
    color : vars.color.darkText,
    resize : "none",
    borderRadius : 5,
    padding : 10,
    border : `1px solid ${vars.color.secondaryDarkText}`,
    boxShadow : "none"
});

export const ContentTextArea = style({
    backgroundColor : vars.color.brightText,
    color : vars.color.darkText,
    height : "350px",
    resize : "none",
    borderRadius : 5,
    padding : 10
});