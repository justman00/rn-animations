import React, { Component } from "react";
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

export default class Deck extends Component {
  state = { index: 0 };

  position = new Animated.ValueXY();

  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gesture) => {
      this.position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (event, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        this.forceSwipe("right");
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        this.forceSwipe("left");
      } else {
        this.resetPosition();
      }
    }
  });

  componentDidUpdate = prevProps => {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();

    if (prevProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  };

  forceSwipe = direction => {
    const x = direction == "right" ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.timing(this.position, {
      toValue: { x, y: 0 },
      timing: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction));
  };

  onSwipeComplete = direction => {
    const { onSwipeRight, onSwipeLeft, data } = this.props;
    const item = data[this.state.index];

    direction == "right" ? onSwipeRight(item) : onSwipeLeft(item);
    this.position.setValue({ x: 0, y: 0 });
    this.setState({ index: this.state.index + 1 });
  };

  resetPosition = () => {
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  };

  getCardStyle = () => {
    const rotate = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ["-120deg", "0deg", "120deg"]
    });

    return {
      ...this.position.getLayout(),
      transform: [{ rotate }]
    };
  };

  renderCards = () => {
    if (this.state.index == this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data
      .map((item, idx) => {
        if (idx < this.state.index) return null;

        if (idx == this.state.index) {
          return (
            <Animated.View
              key={item.id}
              {...this.panResponder.panHandlers}
              style={[this.getCardStyle(), styles.cardStyle]}
            >
              {this.props.renderCard(item)}
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={item.id}
            style={[styles.cardStyle, { top: 10 * (idx - this.state.index) }]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      })
      .reverse();
  };

  render() {
    return <View>{this.renderCards()}</View>;
  }
}

Deck.defaultProps = {
  onSwipeRight: () => {},
  onSwipeLeft: () => {}
};

const styles = {
  cardStyle: {
    position: "absolute",
    width: SCREEN_WIDTH
  }
};
