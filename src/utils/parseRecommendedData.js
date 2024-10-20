import axios from 'axios';
import React from 'react';
import { parseVideoDuration } from './parseVideoDuration';
import { convertRawtoString } from './convertRawtoString';
import { timeSince } from './timeSince';

const API_KEY = process.env.REACT_APP_YOUTUBE_DATA_API_KEY;

export const parseRecommendedData = async (items) => {
   try {
      const videoIds = [];
      const channelIds = [];

      items.forEach((item) => {
         channelIds.push(item.snippet.channelId);
         videoIds.push(item.id.videoId);
      });

      // Fetch channel data
      const {
         data: { items: channelsData },
      } = await axios.get(
         `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelIds.join(
            ","
         )}&key=${API_KEY}`
      );

      const parsedChannelsData = channelsData.map((channel) => ({
         id: channel.id,
         image: channel.snippet.thumbnails.default.url,
      }));

      // Fetch video data
      const {
         data: { items: videosData },
      } = await axios.get(
         `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(
            ","
         )}&key=${API_KEY}`
      );

      const parseData = items.map((item) => {
         const video = videosData.find((video) => video.id === item.id.videoId);
         const channel = parsedChannelsData.find(
            (data) => data.id === item.snippet.channelId
         );

         // Ensure both video and channel data exist before parsing
         if (video && channel) {
            return {
               videoId: item.id.videoId,
               videoTitle: item.snippet.title,
               videoDescription: item.snippet.description,
               videoThumbnail: item.snippet.thumbnails.medium.url,
               videoLink: `https://www.youtube.com/watch?v=${item.id.videoId}`,
               videoDuration: parseVideoDuration(video.contentDetails.duration),
               videoViews: convertRawtoString(video.statistics.viewCount),
               videoAge: timeSince(new Date(item.snippet.publishedAt)),
               channelInfo: {
                  id: item.snippet.channelId,
                  image: channel.image,
                  name: item.snippet.channelTitle,
               },
            };
         }

         return null; // Return null for incomplete data
      });

      return parseData.filter((data) => data !== null); // Filter out null values
   } catch (err) {
      console.log(err);
   }
};
