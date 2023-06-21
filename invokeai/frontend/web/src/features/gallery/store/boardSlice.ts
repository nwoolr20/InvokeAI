import {
  EntityId,
  PayloadAction,
  Update,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';
import { RootState } from 'app/store/store';
import { BoardDTO } from 'services/api';
import { dateComparator } from 'common/util/dateComparator';
import {
  boardCreated,
  boardDeleted,
  boardUpdated,
  receivedBoards,
} from '../../../services/thunks/board';

export const boardsAdapter = createEntityAdapter<BoardDTO>({
  selectId: (board) => board.board_id,
  sortComparer: (a, b) => dateComparator(b.updated_at, a.updated_at),
});

type AdditionalBoardsState = {
  offset: number;
  limit: number;
  total: number;
  isLoading: boolean;
  selectedBoardId?: string;
  searchText?: string;
  updateBoardModalOpen: boolean;
};

export const initialBoardsState =
  boardsAdapter.getInitialState<AdditionalBoardsState>({
    offset: 0,
    limit: 50,
    total: 0,
    isLoading: false,
    updateBoardModalOpen: false,
  });

export type BoardsState = typeof initialBoardsState;

const boardsSlice = createSlice({
  name: 'boards',
  initialState: initialBoardsState,
  reducers: {
    boardUpserted: (state, action: PayloadAction<BoardDTO>) => {
      boardsAdapter.upsertOne(state, action.payload);
    },
    boardUpdatedOne: (state, action: PayloadAction<Update<BoardDTO>>) => {
      boardsAdapter.updateOne(state, action.payload);
    },
    boardRemoved: (state, action: PayloadAction<string>) => {
      boardsAdapter.removeOne(state, action.payload);
    },
    boardIdSelected: (state, action: PayloadAction<string | undefined>) => {
      state.selectedBoardId = action.payload;
    },
    setBoardSearchText: (state, action: PayloadAction<string>) => {
      state.searchText = action.payload;
    },
    setUpdateBoardModalOpen: (state, action: PayloadAction<boolean>) => {
      state.updateBoardModalOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(receivedBoards.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(receivedBoards.rejected, (state) => {
      state.isLoading = false;
    });
    builder.addCase(receivedBoards.fulfilled, (state, action) => {
      state.isLoading = false;
      const { items, offset, limit, total } = action.payload;
      state.offset = offset;
      state.limit = limit;
      state.total = total;
      boardsAdapter.upsertMany(state, items);
    });
    builder.addCase(boardCreated.fulfilled, (state, action) => {
      const board = action.payload;
      boardsAdapter.upsertOne(state, board);
    });
    builder.addCase(boardUpdated.fulfilled, (state, action) => {
      const board = action.payload;
      boardsAdapter.upsertOne(state, board);
    });
    builder.addCase(boardDeleted.pending, (state, action) => {
      const boardId = action.meta.arg;
      console.log({ boardId });
      boardsAdapter.removeOne(state, boardId);
    });
  },
});

export const {
  selectAll: selectBoardsAll,
  selectById: selectBoardsById,
  selectEntities: selectBoardsEntities,
  selectIds: selectBoardsIds,
  selectTotal: selectBoardsTotal,
} = boardsAdapter.getSelectors<RootState>((state) => state.boards);

export const {
  boardUpserted,
  boardUpdatedOne,
  boardRemoved,
  boardIdSelected,
  setBoardSearchText,
  setUpdateBoardModalOpen,
} = boardsSlice.actions;

export const boardsSelector = (state: RootState) => state.boards;

export default boardsSlice.reducer;