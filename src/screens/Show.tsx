import React, { useState, useEffect } from 'react'
import Separator from '../components/Separator'
import Screen from '../components/Screen'
import { humanizeTime, humanizeDate } from '../util/datetime'
import { DjScroll, ShowDescription, EpisodeList } from '../components/show'
import { BASE_URL } from '../config'
import { ShowAPI } from '../types'
import { StackNavigationProp } from '@react-navigation/stack'
import { ScheduleStackParamList } from '../components/navigation/types'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'

type ShowNavigationProp = StackNavigationProp<ScheduleStackParamList, 'Show'>
type ShowRouteProp = RouteProp<ScheduleStackParamList, 'Show'>

export default function Show() {
  const navigation = useNavigation<ShowNavigationProp>()
  const route = useRoute<ShowRouteProp>()

  const [state, setState] = useState({
    description: '',
    djs: [],
    episodes: [],
  } as Pick<ShowAPI, 'description' | 'djs' | 'episodes'>)

  useEffect(() => {
    navigation.setOptions({
      title: route.params.title,
    })

    fetch(BASE_URL + `${route.params.url}.json`)
      .then((response) => response.json())
      .then((response: ShowAPI) => {
        response.episodes.forEach((e) => {
          e.beginning = humanizeDate(e.beginning)

          e.songs.forEach((song) => {
            song.at = humanizeTime(song.at)
          })
        })

        setState({
          description: response.description,
          djs: response.djs,
          episodes: response.episodes,
        })
      })
  }, [])

  return (
    <Screen>
      <DjScroll djs={state.djs} navigation={navigation} />
      <Separator />
      <ShowDescription text={state.description} />
      <EpisodeList episodes={state.episodes} navigation={navigation} />
    </Screen>
  )
}