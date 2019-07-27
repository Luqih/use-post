import { useEffect, useReducer, useState, useCallback } from 'react'
import enhanceFetch from 'enhance-fetch'

const enhancedFetch = enhanceFetch(fetch)

interface PostState {
  response: any
  uploading: boolean
  error: any
}

interface InitialInput {
  initialUrl?: string
  config?: any
}

type DoPost = (url: string, body: any) => void

interface UsePost extends PostState {
  doPost: DoPost
}

type validActionTypes = 'UPLOAD_INIT' | 'UPLOAD_SUCCESS' | 'UPLOAD_ERROR'

const actionTypes = {
  UPLOAD_INIT: 'UPLOAD_INIT',
  UPLOAD_SUCCESS: 'UPLOAD_SUCCESS',
  UPLOAD_ERROR: 'UPLOAD_ERROR'
}

interface Action {
  type: validActionTypes
  payload: any
}

const usePostReducer = (state: PostState, action: Action): PostState => {
  switch (action.type) {
    case actionTypes.UPLOAD_INIT:
      return {
        ...state,
        uploading: true,
        error: false
      }
    case actionTypes.UPLOAD_SUCCESS:
      return {
        ...state,
        response: action.payload,
        uploading: false,
        error: false
      }
    case actionTypes.UPLOAD_ERROR:
      return {
        ...state,
        response: null,
        uploading: false,
        error: true
      }
    default:
      throw new Error()
  }
}

export default function usePost(
  { initialUrl, config }: InitialInput = {},
  initialBody: any
): UsePost {
  const [urlAndBody, setUrlAndBody] = useState({ url: initialUrl, body: initialBody })

  const [state, dispatch] = useReducer(usePostReducer, {
    response: null,
    uploading: false,
    error: false
  })

  useEffect((): (() => void) => {
    let didCancel = false

    const postData = async (): Promise<any> => {
      dispatch({ type: actionTypes.UPLOAD_INIT })

      try {
        const result = await enhancedFetch.post(urlAndBody.url as string, urlAndBody.body, config)

        if (!didCancel) dispatch({ type: actionTypes.UPLOAD_SUCCESS, payload: result })
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error(error)

        if (!didCancel) dispatch({ type: actionTypes.UPLOAD_ERROR })
      }
    }

    if (urlAndBody.url && urlAndBody.body) postData()

    return (): void => {
      didCancel = true
    }
  }, [urlAndBody])

  const doPost: DoPost = useCallback((url, body): void => {
    setUrlAndBody({ url, body })
  }, [])

  return { ...state, doPost }
}
