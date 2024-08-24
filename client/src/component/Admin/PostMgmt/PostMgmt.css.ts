import { style } from "@vanilla-extract/css";

export const AdminPostListStyle = style({
    display: 'grid',
    gridTemplateColumns: '6fr 2fr 2fr 2fr 1fr',
    fontWeight: 'bold',
});

export const AdminPostListDetail = style({
    display: 'grid',
    gridTemplateColumns: '6fr 2fr 2fr 2fr 1fr',
    alignItems: 'center',
    marginBottom: '10px',
});

export const SearchPost = style({
    display: 'flex',       
    justifyContent: 'flex-end', 
    marginBottom: '30px',    
    marginTop : '10px',
});
export const SearchPostInput = style({
    marginRight: '8px' 
});

export const Public = style({
    backgroundColor: '#242424', 
    color: '#ffffff', 
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    ':hover': {
        backgroundColor: '#555555',
    },
});

export const Private = style({
    backgroundColor: '#242424', 
    color: '#A52A2A', 
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    ':hover': {
        backgroundColor: '#555555',
    },
});

export const AdminPostTiTle = style({
    color : 'white',
    ':hover': {
        color: '#808080',
    },
});