// ==UserScript==
// @name            Zoom function for YouTube
// @name:ja         YouTubeで動画をズーム
// @description     YouTube video zoom feature
// @description:ja  YouTubeの動画プレイヤーにズーム機能を追加します
// @version         2.0.1
// @include         /https?:\/\/www\.youtube\.com.*/
// @author          sititou70
// @namespace       https://github.com/sititou70/
// @run-at          document-idle
// @license         MIT; https://opensource.org/licenses/MIT
// ==/UserScript==

(() => {
  // types
  type Position = { x: number; y: number; };
  type Rect = {
    top_left: Position; bottom_right: Position; width: number; height: number;
  };

  // consts
  const SCRIPT_NAME = 'youtube video zoom';
  const VIDEO_CONTAINER_SELECTOR = '#movie_player';
  const VIDEO_SELECTOR = `${VIDEO_CONTAINER_SELECTOR} video`;

  // functions
  const getScaleFromVideo = (video: HTMLVideoElement): number => {
    const scale_string = video.style.transform.match(/scale\((.+?)\)/);
    if (scale_string === null) return 1;

    const scale = parseFloat(scale_string[1]);
    if (isNaN(scale)) return 1;

    return scale;
  };

  const zoomVideoToRect = (video: HTMLVideoElement, rect: Rect): void => {
    const video_container =
        document.querySelector(VIDEO_CONTAINER_SELECTOR) as HTMLDivElement |
        null;
    if (video_container === null) return;

    const video_container_rect = video_container.getBoundingClientRect();
    const player_aspect_ratio =
        video_container_rect.width / video_container_rect.height;
    const selected_aspect_ratio = rect.width / rect.height;

    const fit_width =
        player_aspect_ratio < selected_aspect_ratio;  // or height?

    const scale = fit_width ? video_container_rect.width / rect.width :
                              video_container_rect.height / rect.height;

    const centering_offset: Position = {
      x: fit_width ? 0 : (video_container_rect.width / scale - rect.width) / 2,
      y: fit_width ? (video_container_rect.height / scale - rect.height) / 2 :
                     0,
    };

    video.style.transform = `translateX(${
        ((video_container_rect.width / 2) -
         (rect.top_left.x + rect.width / 2)) *
        scale}px) translateY(${
        ((video_container_rect.height / 2) -
         (rect.top_left.y + rect.height / 2)) *
        scale}px) scale(${scale})`;
    video.style.transition = 'all 0.3s ease';
  };

  let drag_start_position: Position;
  const handleDragStart = (e: MouseEvent): void => {
    const video = e.target as HTMLVideoElement;
    const video_rect = video.getBoundingClientRect();
    const scale = getScaleFromVideo(video);

    drag_start_position = {
      x: (e.clientX - video_rect.x) / scale,
      y: (e.clientY - video_rect.y) / scale,
    };
  };
  const handleDragEnd = (e: MouseEvent): void => {
    const video = e.target as HTMLVideoElement;
    const video_rect = video.getBoundingClientRect();
    const scale = getScaleFromVideo(video);
    const drag_end_position = {
      x: (e.clientX - video_rect.x) / scale,
      y: (e.clientY - video_rect.y) / scale,
    };

    const top_left = {
      x: Math.min(drag_start_position.x, drag_end_position.x),
      y: Math.min(drag_start_position.y, drag_end_position.y),
    };
    const bottom_right = {
      x: Math.max(drag_start_position.x, drag_end_position.x),
      y: Math.max(drag_start_position.y, drag_end_position.y),
    };
    const selected_rect: Rect = {
      top_left,
      bottom_right,
      width: bottom_right.x - top_left.x,
      height: bottom_right.y - top_left.y,
    };

    if (selected_rect.width <= 10 || selected_rect.height <= 10) return;

    zoomVideoToRect(video, selected_rect);
    video.click();
  };

  const setupZoomFeature = (): void => {
    const video =
        document.querySelector(VIDEO_SELECTOR) as HTMLVideoElement | null;
    if (video === null) return;

    video.addEventListener('mousedown', handleDragStart);
    video.addEventListener('mouseup', handleDragEnd);
  };

  const onKeyPress = (e: KeyboardEvent) => {
    const video =
        document.querySelector(VIDEO_SELECTOR) as HTMLVideoElement | null;
    if (video === null) return;
    if (e.key === 'r') video.style.transform = '';
  };

  // main
  const main = (): void => {
    const document_observer = new MutationObserver(setupZoomFeature);
    document_observer.observe(document.body, {
      attributes: true,
    });

    document.addEventListener('keypress', onKeyPress);
  };

  console.log(`[${SCRIPT_NAME}] loaded.`);
  main();
})();
