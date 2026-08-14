FROM ros:noetic-ros-base

RUN apt-get update && apt-get install -y \
    build-essential \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/catkin_ws/src
COPY ./workspace/src /root/catkin_ws/src/

WORKDIR /root/catkin_ws
RUN /bin/bash -c "source /opt/ros/noetic/setup.bash && catkin_make"

RUN echo "source /root/catkin_ws/devel/setup.bash" >> ~/.bashrc
WORKDIR /root/catkin_ws
