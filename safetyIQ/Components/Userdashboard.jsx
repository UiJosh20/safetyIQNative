import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

const Userdashboard = () => {
  const [ids, setID] = useState("");
  const [course, setCourse] = useState("");
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userScore, setUserScore] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [timers, setTimers] = useState({});
  const [examTimers, setExamTimers] = useState({});
  const [isStudyTimerActive, setIsStudyTimerActive] = useState(false);
const [isFetching, setIsFetching] = useState(false);

  const fetchUserID = async () => {
    try {
      const result = await AsyncStorage.getItem("userId");
      let parsedID = JSON.parse(result);
      setID(parsedID);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUserID();
  }, []);

  const currentTopicUrl = `https://safetyiqnativebackend.onrender.com/currentTopic/${ids}`;
  const resultUrl = `https://safetyiqnativebackend.onrender.com/result/${ids}`;

  useEffect(() => {
    if (ids) {
      fetchCurrentTopic();
      fetchUserInfo();
        fetchResult();

      const intervalId = setInterval(() => {
        updateTimers();
        checkTimeAndUpdateState();
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [ids]);

  const fetchUserInfo = () => {
    AsyncStorage.getItem("userInfo")
      .then((info) => {
        const parsedInfo = JSON.parse(info);
        setUserData(parsedInfo);
      })
      .catch((error) => {
        console.log("Error fetching user ", error);
      });
  };

  const fetchCurrentTopic = () => {
    axios
      .get(currentTopicUrl)
      .then((response) => {
        const topics = response.data.currentTopic;

        if (topics) {
          setCourse(topics);
          const initialTimers = { ...timers };
          initialTimers[topics] = 12 * 60 * 60; // Initialize study timer
          setTimers(initialTimers);
          setIsStudyTimerActive(true);

          // Fetch result after course is set
          fetchResult(topics);
        }
      })
      .catch((error) => {
        console.log("no new course to fetch");
      });
  };

 const fetchResult = (courseName) => {
   setIsFetching(true); 
   axios
     .get(resultUrl, {
       params: { course: courseName }, 
     })
     .then((response) => {
       setUserScore(response.data.result);
     })
     .catch((err) => {
       console.log(err);
     })
     .finally(() => {
       setIsFetching(false);
     });
 };


  const updateTimers = () => {
    setTimers((prevTimers) => {
      const updatedTimers = { ...prevTimers };
      Object.keys(updatedTimers).forEach((key) => {
        if (updatedTimers[key] > 0 && isStudyTimerActive) {
          updatedTimers[key] -= 1;
        }
      });
      return updatedTimers;
    });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResult();

    setTimeout(() => {
      fetchUserInfo();
      fetchCurrentTopic();
      setRefreshing(false);
    }, 2000);
    checkTimeAndUpdateState();
  }, []);

  const checkTimeAndUpdateState = () => {
    const now = new Date();
    const currentHours = now.getUTCHours() + 1; // WAT is UTC+1

    if (course && currentHours > 13) {
      setIsStudyTimerActive(true);
    } else {
      setIsStudyTimerActive(false);
    }
  };

  const handleReadNowPress = () => {
    const now = new Date();
    const currentHours = now.getUTCHours() + 1; // WAT is UTC+1

    if (currentHours < 2) {
      Alert.alert("Alert", "You can start reading after 2 PM.");
    } else {
      router.push({
        pathname: "ReadCourse",
        params: { course: course },
      });
    }
  };


  const handleLogout = ()=>{
    router.push("login")
  }
  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {userData ? (
          <>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.circle}
                onPress={() => setModalVisible(true)}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.avatar}
                  />
                ) : (
                  <Text style={styles.avatarPlaceholder}>
                    {userData.firstName[0]}
                  </Text>
                )}
              </TouchableOpacity>
              <View>
                <Text style={styles.welcome}>Welcome</Text>
                <Text style={styles.username}>
                  {userData.firstName} {userData.lastName}
                </Text>
              </View>
            </View>

            <View style={styles.redBox1}>
              <View style={styles.redBox}>
                <View style={styles.whiteBox}>
                  <View style={styles.whiteBoxText}>
                    <Text style={{ textAlign: "center" }}>
                      Current Topic | {course === "" ? "--" : course}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    paddingHorizontal: 20,
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text
                      style={{ color: "white", marginTop: 20, marginBottom: 5 }}
                    >
                      Study Time Left:{" "}
                    </Text>
                    <Text style={styles.timer}>
                      {formatTime(timers[course])}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{ color: "white", marginTop: 20, marginBottom: 5 }}
                    >
                      Test due:{" "}
                    </Text>
                    <Text style={styles.timer}>
                      {timers[course] === 0
                        ? formatTime(examTimers[course])
                        : formatTime(3 * 60 * 60)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  padding: 10,
                  borderRadius: 5,
                  marginTop: -25,
                }}
                onPress={handleReadNowPress}
              >
                <Text style={{ textAlign: "center" }}>Read Now</Text>
              </TouchableOpacity>
            </View>

            <View>
              <View style={styles.examContainer}>
                <Text style={styles.TestText}>Latest Test result</Text>
                <TouchableOpacity onPress={fetchResult}>
                  <Text style={styles.seeMore}>See more</Text>
                </TouchableOpacity>
              </View>

              {isFetching ? (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    height: 100,
                  }}
                >
                  <ActivityIndicator size="large" color="#c30000" />
                </View>
              ) : userScore.length > 0 ? (
                userScore.map((score, index) => (
                  <View key={index} style={styles.scoreBoard}>
                    <Text style={styles.TestText}>{score.topic}</Text>
                    <View style={styles.scoreContainer}>
                      <View>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <View style={styles.correct}>
                            <Text style={styles.correctText}>
                              {score.totalCorrect}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 16 }}>Correct</Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <View style={styles.wrong}>
                            <Text style={styles.correctText}>
                              {score.totalWrong}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 16 }}>Wrong</Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <View style={styles.attempt}>
                            <Text style={styles.correctText}>
                              {score.totalQuestions}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 16 }}>Total Questions</Text>
                        </View>
                      </View>
                      <View>
                        <Text style={styles.percentage}>
                          {Math.round(
                            (score.totalCorrect / score.totalQuestions) * 100
                          )}
                          %
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    height: 100,
                  }}
                >
                  <Text>No scores available</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <ActivityIndicator size="large" color="#c30000" />
        )}

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalLogoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.modalCloseButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  circle: {
    width: 50,
    height: 50,
    backgroundColor: "grey",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    color: "#fff",
    fontSize: 24,
  },

  modalCloseButton: {
    backgroundColor: "#c30000",
    width: "100%",
    padding: 10,
  },

  modalLogoutButton: {
    backgroundColor: "green",
    width: "100%",
    padding: 10,

  },
  modalCloseButtonText:{
    color:"white",
    fontSize:15,
    fontWeight:"bold"
  },
  welcome: {
    fontFamily: "Kanit-Regular",
    fontSize: 20,
  },
  username: {
    fontFamily: "Kanit-Light",
    fontSize: 12,
  },
  redBox: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  redBox1: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    backgroundColor: "#C30000",
    marginTop: 50,
    marginBottom: 20,
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 15,
  },
  whiteBox: {
    width: 250,
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 10,
    position: "absolute",
    top: -2,
    left: 40,
    paddingHorizontal: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  whiteBoxText: {
    fontFamily: "Kanit-Light",
    fontSize: 13,
    color: "#000",
    textAlign: "center",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  courseContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timer: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 25,
  },
  listItem: {
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    marginHorizontal: 5,
  },
  TestText: {
    fontWeight: "bold",
    fontSize: 17,
  },
  seeMore: {
    color: "blue",
    fontWeight: "bold",
  },

  examContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
  },
  scoreBoard: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 25,
    marginVertical: 10,
    shadowColor: "rgba(0,0,0,0.6)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  correct: {
    backgroundColor: "green",
    padding: 3,
    borderRadius: 5,
    width: 40,
    marginTop: 13,
  },

  correctText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
  },

  wrong: {
    backgroundColor: "#C30000",
    padding: 3,
    borderRadius: 5,
    width: 40,
    marginTop: 13,
  },

  attempt: {
    backgroundColor: "blue",
    padding: 3,
    borderRadius: 5,
    width: 40,
    marginTop: 13,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  percentage: {
    fontWeight: "bold",
    fontSize: 40,
    color: "#53BD5E",
  },
});

export default Userdashboard;
