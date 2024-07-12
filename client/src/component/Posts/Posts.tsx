import { sendGetPostRequest, sendGetPostsRequest } from "../../api/posts/crud";

const Posts = () => {

  const getPosts = () => {
    sendGetPostsRequest().then((res)=>{
      console.log(res);
    });
  };

  const getPost = () => {
    const post_id = '1';
    sendGetPostRequest(post_id).then((res)=>{
      console.log(res);
    });
  };

  return (
    <div>
      <button onClick={getPosts}>게시글 목록 불러오기</button>
      <button onClick={getPost}>게시글 내용 보기</button>
    </div>
  )
}

export default Posts