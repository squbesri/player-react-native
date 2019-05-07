import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableWithoutFeedback
} from 'react-native'
import Settings from './Settings'
import { Audio } from 'expo'
import { Container } from 'flux/utils'
import OnAirStore from './flux/OnAirStore'
import OnAirDispatcher from './flux/OnAirDispatcher'
import Icon from 'react-native-vector-icons/Ionicons'
import { colors, dimensions } from './styles/main'
import Moment from 'moment'
import { windowStyles } from './styles/components'
// import Spin from 'react-native-spinjs'

class Radio extends React.Component {
  static navigationOptions = {
    title: 'Radio'
  }

  static getStores() {
    return [OnAirStore]
  }

  static calculateState(prevState) {
    return {
      on_air: OnAirStore.getState()
    }
  }

  constructor() {
    super()
    this.state = {
      uri: 'http://floyd.wcbn.org:8000/wcbn-hd.mp3',
      isPlaying: false,
      isBuffering: false,
      isLoading: true,
      isUnloading: false,
      albumArtwork:
        'https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/924faf52097223.590463d34792e.jpg'
    }

    this.playbackInstance = null
  }

  async componentDidMount() {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true
    })

    this._loadNewPlaybackInstance()

    const pollForNewSong = () => {
      this.fetchPlaylist().then(() => {
        OnAirDispatcher.dispatch({
          type: 'CHECK_FOR_NEW_SONG',
          data: this.state.on_air
        })
      })
    }

    pollForNewSong()
    setInterval(pollForNewSong, 60000)
  }

  fetchPlaylist() {
    return new Promise((resolve, reject) => {
      fetch('https://app.wcbn.org/playlist.json')
        .then(response => response.json())
        .then(data => {
          data.on_air.songs.forEach(song => {
            song.at = Moment(song.at).format('h:mm A')
          })
          this.setState({
            on_air: data.on_air
          })
          resolve()
        })
    })
  }

  async _unloadPlaybackInstance() {
    if (this.playbackInstance != null) {
      this.setState({
        isPlaying: false,
        isLoading: false,
        isUnloading: true
      })

      await this.playbackInstance.unloadAsync()
      // this.playbackInstance.setOnPlaybackStatusUpdate(null)
      // this.playbackInstance = null
    }
  }

  async _loadNewPlaybackInstance() {
    this.setState({ isLoading: true })
    const { sound, status } = await Audio.Sound.createAsync(
      { uri: this.state.uri },
      { shouldPlay: true },
      this._onPlaybackStatusUpdate
    )
    this.playbackInstance = sound
  }

  _onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      this.setState({
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering
      })
    } else if (status.error) {
      console.log(`FATAL PLAYER ERROR: ${status.error}`)
    }
  }

  _onPress = () => {
    if (this.playbackInstance != null) {
      if (this.state.isPlaying) {
        //unload
        this._unloadPlaybackInstance().then(() => {
          this.setState({
            isUnloading: false
          })
        })
      } else if (
        !this.state.isLoading &&
        !this.state.isUnloading &&
        !this.state.isBuffering
      ) {
        //load and play
        this._loadNewPlaybackInstance().then(() => {
          this.setState({
            isLoading: false
          })
        })
      }
    }
  }

  // renderSpinner() {
  //   if (this.state.isLoading && !this.state.isPlaying) {
  //     return (
  //       <Spin
  //         radius={dimensions.fullWidth / 3}
  //         width={3}
  //         color={colors.active}
  //       />
  //     )
  //   }
  // }

  renderIcon() {
    return (
      <View>
        <Icon
          name={this.state.isPlaying ? 'ios-pause' : 'ios-play'}
          size={150}
          color={colors.active}
          style={{ ...styles.icon, paddingLeft: this.state.isPlaying ? 7 : 35 }}
        />
      </View>
    )
  }

  renderNowPlaying() {
    let x = this.state.on_air.songs[0]

    if (x == undefined) {
      x = { name: '', artist: '', album: '', label: '', year: '' }
    }

    return (
      <View style={styles.nowPlaying}>
        <Text style={styles.nowPlayingText}>{x.name || '-'}</Text>
        <Text style={styles.nowPlayingText}>{x.artist || '-'}</Text>
        <Text style={styles.nowPlayingText}>{x.album || '-'}</Text>
        <Text style={styles.nowPlayingText}>
          {x.label + (x.year ? ` (${x.year})` : '')}
        </Text>
      </View>
    )
  }

  render() {
    return (
      <TouchableWithoutFeedback onPress={this._onPress}>
        <View style={{ ...windowStyles.container, ...styles.container }}>
          {/* {this.renderSpinner()} */}
          {this.renderIcon()}
          {this.renderNowPlaying()}
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#212733'
  },
  icon: {
    paddingBottom: 40
  },
  infoText: {
    color: colors.inactive
  },
  nowPlaying: {
    padding: 25
  },
  nowPlayingText: {
    color: colors.active,
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center'
  }
})

export default Container.create(Radio)
