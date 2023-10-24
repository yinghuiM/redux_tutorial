import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import formatDate from "../../utils.js/date";
import axios from "axios";

const initialState = {
  posts: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const POST_URL = "https://jsonplaceholder.typicode.com/posts";

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
  const res = await axios.get(POST_URL);
  const data = res.data.slice(0, 20);
  return data;
});

export const createNewPost = createAsyncThunk(
  "posts/addPost",
  async (initPost) => {
    const res = await axios.post(POST_URL, initPost);
    return res.data;
  }
);
const postSlice = createSlice({
  name: "posts",
  // createSlice 的 name 属性被设置为 'posts'，这就意味着这个 slice 的状态会被存储在 state 对象的 posts 属性里。
  // reducer 函数是操作 state 对象的，而这里的state 对象实际上就是指向 'posts' slice 的。
  // 因此，在 reducer 函数里的 state 已经是这个 'posts' slice 的局部状态，而不是整个应用的全局 state。
  initialState,
  reducers: {
    addPost: {
      reducer(state, action) {
        state.posts.push(action.payload);
      },
      prepare(title, content, userId) {
        return {
          payload: {
            id: nanoid(),
            title,
            content,
            userId,
            date: formatDate(new Date()),
            reactions: {
              thumbsUp: 0,
              wow: 0,
              heart: 0,
              rocket: 0,
              coffee: 0,
            },
          },
        };
      },
    },
    addReaction: {
      reducer(state, action) {
        const { postId, reaction } = action.payload;
        const isExistPost = state.posts.find((post) => post.id === postId);
        if (isExistPost) {
          isExistPost.reactions[reaction]++;
        }
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";

        const loadedPosts = action.payload.map((post) => {
          post.date = formatDate(new Date());
          post.reactions = {
            thumbsUp: 0,
            wow: 0,
            heart: 0,
            rocket: 0,
            coffee: 0,
          };
          return post;
        });

        state.posts = state.posts.concat(loadedPosts);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createNewPost.fulfilled, (state, action) => {
        action.payload.id = state.posts[state.posts.length - 1].id + 1;
        action.payload.userId = Number(action.payload.userId);
        action.payload.date = formatDate(new Date());
        action.payload.reactions = {
          thumbsUp: 0,
          wow: 0,
          heart: 0,
          rocket: 0,
          coffee: 0,
        };
        state.posts.push(action.payload);
      });
  },
});

// state.posts 是一个对整个 "posts" slice（由 createSlice 创建）的引用。这个 slice 包括 posts、status 和 error 这几个平级的属性。
export const allPosts = (state) => state.posts.posts;
export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;

export const { addPost, addReaction } = postSlice.actions;

export default postSlice.reducer;
